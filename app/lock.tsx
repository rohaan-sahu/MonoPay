import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { authenticateUser } from '@/services/localAuthServices';
import { Ionicons } from '@expo/vector-icons';

export default function LockScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuth = async () => {
    const result = await authenticateUser();
    
    if (result.success) {
      setIsAuthenticated(true);
    } else {
      Alert.alert("Security Required", result.error || "Authentication failed");
    }
  };

  // Optional: Auto-prompt on mount
  useEffect(() => { handleAuth(); }, []);

  if (isAuthenticated) {

    return (
      <View >
        <Text>Screen unlocked. Rendered from `./app/lock.tsx`</Text>
      </View>
    );
  }

  return (
    <View >
      <Ionicons name = 'apps-outline' />
      <Text>This area is locked</Text>
      <Button title="Unlock with PIN/Pattern" onPress={handleAuth} />
    </View>
  );
}