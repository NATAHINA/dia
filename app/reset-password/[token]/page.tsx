'use client';
import { PasswordInput, Button, Paper, Title, Container, Stack, Alert, Center, LoadingOverlay } from '@mantine/core';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleReset = async () => {
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    
    setLoading(true);
    setError(null);

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      router.push('/'); // Redirection après succès
    } else {
      const data = await res.json();
      setError(data.error || "Une erreur est survenue.");
      setLoading(false);
    }
  };

  return (
    <Center mih="100vh">
      <Container size={420} w="100%" px="md">
        <Paper withBorder p={30} radius="md" style={{ position: 'relative' }}>
          <LoadingOverlay visible={loading} zIndex={1000} />
          <Title order={3} mb="md">Nouveau mot de passe</Title>
          
          <Stack gap="md">
            {error && <Alert color="red" icon={<IconAlertCircle size={16}/>}>{error}</Alert>}
            
            <PasswordInput 
              label="Nouveau mot de passe" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
            />
            
            <PasswordInput 
              label="Confirmer le mot de passe" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} 
            />
            
            <Button 
              fullWidth 
              onClick={handleReset}
              disabled={loading}
            >
              Enregistrer
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Center>
  );
}