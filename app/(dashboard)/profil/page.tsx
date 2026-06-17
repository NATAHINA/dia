'use client';

import { useState, useEffect } from 'react';
import {
  Container, Title, Text, Card, Grid, TextInput, Button, Stack, Avatar,
  Group, Divider, PasswordInput, Switch, Alert, LoadingOverlay
} from '@mantine/core';
import { IconUser, IconLock, IconCheck, IconSettings, IconX } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function ProfilPage() {
  const router = useRouter();
  const [globalLoading, setGlobalLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Stockage de l'ID utilisateur
  const [userId, setUserId] = useState<string | null>(null);

  // Profil Form States
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [role, setRole] = useState('Agent');
  const [alertProfil, setAlertProfil] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Sécurité Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [alertPassword, setAlertPassword] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Préférences States
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifVentes, setNotifVentes] = useState(true);

  const [loadingTrigger, setLoadingTrigger] = useState(false);

  // Charger le profil de l'utilisateur actif au démarrage
  useEffect(() => {
    const loadProfilData = async () => {
      try {
        setGlobalLoading(true);
        // 1. Récupération de l'ID depuis le stockage local de session
        const storedUserId = localStorage.getItem('userId');
        
        if (!storedUserId) {
          router.push('/'); // Redirige si aucune session n'existe
          return;
        }

        setUserId(storedUserId);

        // 2. Passage de l'ID utilisateur dans les headers
        const res = await fetch('/api/profil', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': storedUserId
          }
        });

        if (res.ok) {
          const data = await res.json();
          setNom(data.nom || '');
          setEmail(data.email || '');
          setTelephone(data.telephone || '');
          setRole(data.role || 'Agent');
          setNotifEmail(data.notifEmail ?? true);
          setNotifVentes(data.notifVentes ?? true);
        } else {
          router.push('/');
        }
      } catch (err) {
        console.error("Erreur de chargement du profil", err);
      } finally {
        setGlobalLoading(false);
      }
    };

    loadProfilData();
  }, [router]);

  // Action : Mettre à jour les informations générales
  const handleUpdateProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setActionLoading(true);
    setAlertProfil(null);

    try {
      const res = await fetch('/api/profil', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userId // Ajout du header d'identification
        },
        body: JSON.stringify({ action: 'UPDATE_INFO', nom, email, telephone })
      });

      const data = await res.json();
      if (res.ok) {
        setAlertProfil({ type: 'success', msg: 'Vos informations personnelles ont été enregistrées avec succès.' });
      } else {
        setAlertProfil({ type: 'error', msg: data.error || 'Erreur lors de la mise à jour.' });
      }
    } catch (err) {
      setAlertProfil({ type: 'error', msg: 'Erreur réseau.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Action : Changement sécurisé de mot de passe
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setAlertPassword(null);

    if (newPassword !== confirmPassword) {
      setAlertPassword({ type: 'error', msg: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/profil', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userId // Ajout du header d'identification
        },
        body: JSON.stringify({ action: 'CHANGE_PASSWORD', currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setAlertPassword({ type: 'success', msg: 'Votre mot de passe a été modifié avec succès.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setAlertPassword({ type: 'error', msg: data.error || 'Erreur sécurité.' });
      }
    } catch (err) {
      setAlertPassword({ type: 'error', msg: 'Erreur réseau.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Action : Commutateurs de préférences système
  const handlePreferenceChange = async (type: 'email' | 'ventes', checked: boolean) => {
    if (!userId) return;

    const updatedEmail = type === 'email' ? checked : notifEmail;
    const updatedVentes = type === 'ventes' ? checked : notifVentes;

    if (type === 'email') setNotifEmail(checked);
    if (type === 'ventes') setNotifVentes(checked);

    try {
      await fetch('/api/profil', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userId // Ajout du header d'identification
        },
        body: JSON.stringify({
          action: 'UPDATE_PREFERENCES',
          notifEmail: updatedEmail,
          notifVentes: updatedVentes
        })
      });
    } catch (err) {
      console.error("Impossible de sauvegarder vos préférences système", err);
    }
  };

  const handleTriggerTestEmail = async () => {
    setLoadingTrigger(true);
    try {
      const res = await fetch('/api/cron/rapport-hebdo', { method: 'GET' });
      const data = await res.json();
      if (res.ok) {
        alert("Succès ! Le script a vérifié la base de données et envoyé les rapports aux utilisateurs cochés.");
      } else {
        alert("Erreur lors du test : " + data.error);
      }
    } catch (err) {
      alert("Impossible de joindre l'API d'envoi.");
    } finally {
      setLoadingTrigger(false);
    }
  };

  return (
    <Container size="lg" py="md" style={{ position: 'relative' }}>
      <LoadingOverlay visible={globalLoading || actionLoading} overlayProps={{ radius: 'sm', blur: 1 }} />

      <div style={{ marginBottom: '2rem' }}>
        <Title order={2}>Mon Profil & Paramètres</Title>
        <Text c="dimmed" size="sm">Gérez vos informations personnelles, vos identifiants de sécurité et vos préférences</Text>
      </div>

      <Grid>
        {/* COLONNE GAUCHE */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          {/* CARD : INFORMATIONS GÉNÉRALES */}
          <Card withBorder shadow="sm" radius="lg" p="xl" mb="xl">
            <Group mb="lg" gap="md">
              <Avatar size="xl" radius="xl" color="blue">
                {nom ? nom.substring(0, 2).toUpperCase() : '??'}
              </Avatar>
              <div>
                <Text fw={700} size="lg">{nom || 'Utilisateur'}</Text>
                <Text size="md" c="dimmed">{role} de l'application</Text>
              </div>
            </Group>

            <Divider my="md" label="Informations Générales" labelPosition="left" />

            <form onSubmit={handleUpdateProfil}>
              <Stack gap="md">
                {alertProfil && (
                  <Alert icon={alertProfil.type === 'success' ? <IconCheck size={16} /> : <IconX size={16} />} title={alertProfil.type === 'success' ? "Succès" : "Erreur"} color={alertProfil.type === 'success' ? 'green' : 'red'} radius="md">
                    {alertProfil.msg}
                  </Alert>
                )}
                <TextInput label="Nom complet" value={nom} onChange={(e) => setNom(e.target.value)} required radius="md" leftSection={<IconUser size={16} />} />
                <TextInput label="Adresse Email professionnelle" value={email} onChange={(e) => setEmail(e.target.value)} required type="email" radius="md" />
                <TextInput label="Numéro de Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} radius="md" placeholder="Ex: +261 34 xx xxx xx" />
                
                <Button type="submit" style={{ alignSelf: 'flex-start' }} mt="md" radius="md" disabled={actionLoading}>
                  Enregistrer mon profil
                </Button>
              </Stack>
            </form>
          </Card>

          {/* CARD : SÉCURITÉ */}
          <Card withBorder shadow="sm" radius="lg" p="xl">
            <Group mb="sm"><IconLock size={20} color="var(--mantine-color-red-6)" /><Text fw={700} size="md">Sécurité du compte</Text></Group>
            <Text size="xs" c="dimmed" mb="lg">Modifiez régulièrement votre mot de passe pour sécuriser vos accès de gestion</Text>

            <form onSubmit={handleChangePassword}>
              <Stack gap="md">
                {alertPassword && (
                  <Alert icon={alertPassword.type === 'success' ? <IconCheck size={16} /> : <IconX size={16} />} title={alertPassword.type === 'success' ? "Validé" : "Alerte Sécurité"} color={alertPassword.type === 'success' ? 'green' : 'red'} radius="md">
                    {alertPassword.msg}
                  </Alert>
                )}
                <PasswordInput label="Mot de passe actuel" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} radius="md" />
                <PasswordInput label="Nouveau mot de passe" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} radius="md" />
                <PasswordInput label="Confirmer le nouveau mot de passe" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} radius="md" />
                
                <Button type="submit" color="red" style={{ alignSelf: 'flex-start' }} mt="md" radius="md" disabled={actionLoading}>
                  Mettre à jour le mot de passe
                </Button>
              </Stack>
            </form>
          </Card>
        </Grid.Col>

        {/* COLONNE DROITE */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card withBorder shadow="sm" radius="lg" p="xl" style={{ height: '100%' }}>
            <Group mb="md">
              <IconSettings size={20} color="var(--mantine-color-blue-6)" />
              <Text fw={700} size="md">Préférences du Système</Text>
            </Group>
            <Text size="xs" c="dimmed" mb="xl">Configurez le comportement de l'application et les canaux de communication</Text>

            <Stack gap="lg">
              <Switch
                label="Rapports par Email"
                description="Recevoir un résumé hebdomadaire de l'atteinte des objectifs de chiffre d'affaires."
                checked={notifEmail}
                onChange={(event) => handlePreferenceChange('email', event.currentTarget.checked)}
              />

              <Switch
                label="Alertes Marketing"
                description="Être notifié lorsqu'une campagne publicitaire dépasse un taux de transformation critique."
                checked={notifVentes}
                onChange={(event) => handlePreferenceChange('ventes', event.currentTarget.checked)}
              />

              <Button 
                variant="light" 
                color="blue" 
                size="xs" 
                mt="xs"
                loading={loadingTrigger}
                onClick={handleTriggerTestEmail}
              >
                Simuler et lancer l'envoi des e-mails maintenant
              </Button>

              {/* SECTION SUPPORT TECHNIQUE CORRIGÉE */}
              <Divider my="xs" />
              
              <Stack gap={8}>
                <Text size="sm" fw={600} c="blue.7">
                  Support Technique & Développeur
                </Text>
                
                <Group gap="xs" wrap="nowrap">
                  <Text size="xs" fw={500} style={{ minWidth: 70 }}>Email :</Text>
                  <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                    contact@agence.me
                  </Text>
                </Group>

                <Group gap="xs" wrap="nowrap">
                  <Text size="xs" fw={500} style={{ minWidth: 70 }}>Contact :</Text>
                  <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                    +261 34 00 000 00
                  </Text>
                </Group>

                <Text size="11px" c="dimmed" mt={4}>
                  Besoin d'une assistance ou d'une nouvelle fonctionnalité ? Contactez votre développeur.
                </Text>
              </Stack>
              
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}