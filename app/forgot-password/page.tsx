'use client';
import { TextInput, Button, Paper, Title, Container, LoadingOverlay, Center, Alert } from '@mantine/core';
import { useState } from 'react';
import { IconCheck, IconAlertCircle } from '@tabler/icons-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setStatus(null); // Réinitialiser le statut

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: "Si cet email existe, un lien vous a été envoyé." });
      } else {
        setStatus({ type: 'error', message: data.error || "Une erreur est survenue." });
      }
    } catch (err) {
      setStatus({ type: 'error', message: "Erreur de connexion au serveur." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center mih="100vh"> 
      <Container size={420} w="100%" px="md">
        <Paper withBorder p={30} radius="md" style={{ position: 'relative' }}>
          <LoadingOverlay visible={loading} zIndex={1000} />
          
          <Title order={3} mb="md">Récupération</Title>
          
          {status && (
            <Alert 
              color={status.type === 'success' ? 'teal' : 'red'} 
              icon={status.type === 'success' ? <IconCheck size={16}/> : <IconAlertCircle size={16}/>}
              mb="md"
            >
              {status.message}
            </Alert>
          )}

          <TextInput 
              label="Email" 
              placeholder="nom@agence.me" 
              onChange={(e) => setEmail(e.target.value)} 
              mb="md"
              disabled={status?.type === 'success'}
          />
          
          <Button 
            fullWidth 
            onClick={handleSubmit} 
            disabled={loading || status?.type === 'success'}
          >
              Envoyer le lien
          </Button>
        </Paper>
      </Container>
    </Center>
  );
}