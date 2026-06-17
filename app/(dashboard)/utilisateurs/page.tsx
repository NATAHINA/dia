'use client';

import { useState, useEffect } from 'react';
import {
  Container, Title, Text, Card, Table, ScrollArea, Badge, Button, Group,
  ActionIcon, Modal, TextInput, Select, Stack, Avatar, LoadingOverlay
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconShield, IconAlertTriangle } from '@tabler/icons-react';

interface Utilisateur {
  _id: string;
  nom: string;
  email: string;
  role: 'Administrateur' | 'Agent' | 'Comptable';
  statut: 'Actif' | 'Inactif';
  telephone?: string;
}

export default function UtilisateursPage() {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [search, setSearch] = useState('');
  const [globalLoading, setGlobalLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modals status
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  
  const [selectedUser, setSelectedUser] = useState<Utilisateur | null>(null);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  // Form States
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string | null>('Agent');
  const [statut, setStatut] = useState<string | null>('Actif');

  // Charger les utilisateurs depuis MongoDB via l'API
  const fetchUtilisateurs = async () => {
    try {
      setGlobalLoading(true);
      const res = await fetch('/api/utilisateurs');
      if (res.ok) {
        const data = await res.json();
        setUtilisateurs(data);
      } else {
        alert("Erreur lors de la récupération des utilisateurs.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    fetchUtilisateurs();
  }, []);

  const handleOpenAdd = () => {
    setSelectedUser(null);
    setNom('');
    setEmail('');
    setRole('Agent');
    setStatut('Actif');
    openForm();
  };

  const handleOpenEdit = (user: Utilisateur) => {
    setSelectedUser(user);
    setNom(user.nom);
    setEmail(user.email);
    setRole(user.role);
    setStatut(user.statut);
    openForm();
  };

  const handleOpenDelete = (id: string) => {
    setIdToDelete(id);
    openDelete();
  };

  // Ajouter ou Modifier un utilisateur (POST / PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    // Sécurité : vérifier que l'ID existe bien avant de lancer l'édition
    if (selectedUser && !selectedUser._id) {
      alert("Erreur : L'identifiant de l'utilisateur est manquant.");
      setActionLoading(false);
      return;
    }

    try {
      const url = selectedUser ? `/api/utilisateurs/${selectedUser._id}` : '/api/utilisateurs';
      const method = selectedUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, email, role, statut })
      });

      // 1. On vérifie d'abord si la réponse est bien du JSON avant de la parser
      const contentType = res.headers.get("content-type");
      if (!res.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          alert(`Erreur : ${errorData.error}`);
        } else {
          // Si le serveur a crashé ou renvoyé du HTML (Erreur 500 ou 404)
          alert(`Le serveur a renvoyé une erreur critique (Statut ${res.status}). Vérifiez vos logs serveur.`);
        }
        return;
      }

      // 2. Si tout est OK, on rafraîchit la liste
      await fetchUtilisateurs();
      closeForm();

    } catch (err) {
      console.error("Erreur réseau ou client :", err);
      alert("Impossible de contacter le serveur.");
    } finally {
      setActionLoading(false);
    }
  };

  // Supprimer définitivement un utilisateur (DELETE)
  const confirmDelete = async () => {
    if (!idToDelete) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/utilisateurs/${idToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchUtilisateurs();
        closeDelete();
        setIdToDelete(null);
      } else {
        alert("Impossible de supprimer cet utilisateur.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = utilisateurs.filter(u =>
    u.nom?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container size="xl" py="md" style={{ position: 'relative' }}>
      <LoadingOverlay visible={globalLoading} overlayProps={{ radius: 'sm', blur: 2 }} />

      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>Utilisateurs & Comptes</Title>
          <Text c="dimmed" size="sm">Gérez les accès de vos collaborateurs et attribuez des rôles sécurisés</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={handleOpenAdd} radius="md">
          Ajouter un collaborateur
        </Button>
      </Group>

      <TextInput
        placeholder="Rechercher par nom ou email..."
        mb="md"
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        radius="md"
        style={{ maxWidth: 400 }}
      />

      <Card withBorder shadow="sm" radius="lg" p={0} style={{ overflow: 'hidden' }}>
        <ScrollArea>
          <Table miw={800} verticalSpacing="md" horizontalSpacing="md" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Collaborateur</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Rôle d'accès</Table.Th>
                <Table.Th ta="center">Statut</Table.Th>
                <Table.Th ta="center">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredUsers.length === 0 && !globalLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={5} ta="center">
                    <Text c="dimmed" py="xl">Aucun collaborateur trouvé</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredUsers.map(user => (
                  <Table.Tr key={user._id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar radius="xl" color={user.role === 'Administrateur' ? 'blue' : 'teal'}>
                          {user.nom?.substring(0, 2).toUpperCase()}
                        </Avatar>
                        <Text size="sm" fw={600}>{user.nom}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>{user.email}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={user.role === 'Administrateur' ? 'red' : user.role === 'Comptable' ? 'orange' : 'blue'} leftSection={<IconShield size={12} />}>
                        {user.role}
                      </Badge>
                    </Table.Td>
                    <Table.Td ta="center">
                      <Badge color={user.statut === 'Actif' ? 'green' : 'gray'} variant="dot">
                        {user.statut}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" justify="center">
                        <ActionIcon variant="subtle" color="blue" onClick={() => handleOpenEdit(user)}>
                          <IconEdit size={18} />
                        </ActionIcon>
                        
                        {user.role !== 'Administrateur' && (
                          <ActionIcon variant="subtle" color="red" onClick={() => handleOpenDelete(user._id)}>
                            <IconTrash size={18} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>

      {/* MODAL AJOUT / ÉDITION */}
      <Modal opened={formOpened} onClose={closeForm} title={selectedUser ? "Modifier les accès" : "Créer un profil collaborateur"} centered radius="lg">
        <form onSubmit={handleSubmit}>
          <Stack gap="md" style={{ position: 'relative' }}>
            <LoadingOverlay visible={actionLoading} overlayProps={{ radius: 'sm', blur: 1 }} />
            <TextInput label="Nom complet" placeholder="Ex: Jean Dupont" required value={nom} onChange={(e) => setNom(e.target.value)} radius="md" />
            <TextInput label="Adresse Email" placeholder="adresse@agence.mg" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} radius="md" />
            <Select label="Rôle au sein de l'agence" data={['Administrateur', 'Agent', 'Comptable']} value={role} onChange={setRole} radius="md" required />
            <Select label="Statut du compte" data={['Actif', 'Inactif']} value={statut} onChange={setStatut} radius="md" required />
            <Button type="submit" fullWidth mt="md" radius="md">
              {selectedUser ? "Enregistrer" : "Créer le compte"}
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* MODAL CONFIRMATION SUPPRESSION */}
      <Modal opened={deleteOpened} onClose={closeDelete} centered radius="md" size="sm" withCloseButton={false}>
        <Group gap="sm" mb="md">
          <IconAlertTriangle size={24} color="var(--mantine-color-red-6)" />
          <Text fw={700} size="lg">Confirmer la suppression</Text>
        </Group>
        <Text size="sm" c="dimmed" mb="xl">Êtes-vous sûr de vouloir révoquer et supprimer ce collaborateur ?</Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="light" color="gray" radius="md" onClick={closeDelete} disabled={actionLoading}>
            Annuler
          </Button>
          <Button color="red" radius="md" onClick={confirmDelete} loading={actionLoading}>
            Supprimer
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}