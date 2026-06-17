'use client';

import { 
  TextInput, 
  PasswordInput, 
  Anchor, 
  Paper, 
  Group, 
  Button,
  Flex,
  Box,
  Stack,
  ThemeIcon,
  Alert
} from '@mantine/core';
import { IconBriefcase2, IconAlertCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AuthenticationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        if (data.user && data.user._id) {
          localStorage.setItem('userId', data.user._id);
        }
        router.push('/main');
      } else {
        setErrorMessage(data.error || 'Impossible de vous connecter.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Erreur réseau. Impossible de joindre le serveur.');
      setLoading(false);
    }
  };

  return (
    <Flex 
      mih="100vh" 
      w="100vw" 
      justify="center" 
      align="center" 
      px="md"
      bg="gray.0"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, var(--mantine-color-blue-0) 0%, var(--mantine-color-gray-0) 100%)',
      }}
    >
      <Box w="100%" style={{ maxWidth: 420 }}>
        
        <Stack align="center" gap="xs" mb="lg">
          <ThemeIcon size={50} radius="xl" variant="light" color="blue">
            <IconBriefcase2 size="1.8rem" />
          </ThemeIcon>
        </Stack>

        <Paper withBorder shadow="xl" p={{ base: 'xl', sm: 35 }} radius="lg" bg="white">
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              
              {errorMessage && (
                <Alert 
                  variant="light" 
                  color="red" 
                  title="Échec de connexion" 
                  icon={<IconAlertCircle size={16} />}
                  radius="md"
                >
                  {errorMessage}
                </Alert>
              )}

              <TextInput 
                label="Adresse Email" 
                placeholder="nom@agence.me" 
                required 
                size="md"
                radius="md"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              
              <PasswordInput 
                label="Mot de passe" 
                placeholder="Votre mot de passe" 
                required 
                size="md"
                radius="md"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              
              <Group justify="space-between" mt="xs">
                <Anchor 
                  component="button" 
                  size="sm" 
                  type="button" 
                  fw={500}
                  onClick={() => router.push('/forgot-password')}>
                  Mot de passe oublié ?
                </Anchor>
              </Group>

              <Button 
                type="submit" 
                fullWidth 
                mt="md" 
                size="md"
                radius="md"
                loading={loading}
                variant="filled"
                color="blue"
              >
                Se connecter
              </Button>
            </Stack>
          </form>
        </Paper>
      </Box>
    </Flex>
  );
}