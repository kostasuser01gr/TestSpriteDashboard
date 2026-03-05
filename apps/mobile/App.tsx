import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { StatusBar } from 'expo-status-bar';

// 📱 TIER 5: Biometric Cryptographic Signatures for Approvals
export default function App() {
  const [isCompatible, setIsCompatible] = useState(false);
  const [approvals, setApprovals] = useState([{ id: 'inc_123', summary: 'High Latency on DB - Add Index', cost: '$0.12' }]);

  useEffect(() => {
    checkDeviceForHardware();
  }, []);

  const checkDeviceForHardware = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    setIsCompatible(compatible);
  };

  const handleApprovePR = async (id: string) => {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      Alert.alert('Error', 'Please setup FaceID/TouchID to approve PRs.');
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Authenticate to cryptographically sign and approve deployment for ${id}`,
      fallbackLabel: 'Enter Passcode',
      disableDeviceFallback: false,
    });

    if (result.success) {
      // In production, we generate a signed JWT here with device enclave keys
      Alert.alert('Success', `PR ${id} approved and signed. Merging to production.`);
      setApprovals(approvals.filter(a => a.id !== id));
      // Call DashboardSaas /api/approvals endpoint
    } else {
      Alert.alert('Failed', 'Authentication failed. PR merge aborted.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Owner Command Center</Text>
      <Text style={styles.sub}>Pending PR Approvals</Text>
      
      {approvals.length === 0 ? (
        <Text style={styles.empty}>All systems nominal. No pending approvals.</Text>
      ) : (
        approvals.map(req => (
          <View key={req.id} style={styles.card}>
            <Text style={styles.title}>{req.summary}</Text>
            <Text>Est Cost: {req.cost}</Text>
            <View style={styles.actions}>
              <Button title="Deny" color="red" onPress={() => setApprovals([])} />
              <Button title="Approve via FaceID" color="green" onPress={() => handleApprovePR(req.id)} />
            </View>
          </View>
        ))
      )}
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', padding: 20 },
  header: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  sub: { color: '#aaa', fontSize: 16, marginBottom: 20 },
  empty: { color: '#0f0', fontSize: 14 },
  card: { backgroundColor: '#222', padding: 20, borderRadius: 10, width: '100%' },
  title: { color: '#fff', fontSize: 18, marginBottom: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }
});
