'use client';

import { useState, useEffect } from 'react';
import { 
  Container, Title, Text, Card, Table, ScrollArea, Button, 
  Group, ActionIcon, Modal, TextInput, Stack, Textarea 
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconAlertTriangle } from '@tabler/icons-react';

interface Client {
  _id?: string;
  nomComplet: string;
  telephone: string;
  email: string;
  adresse: string;
  notes: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);

  // States pour la modal de suppression
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  // Form State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nomComplet, setNomComplet] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('');
  const [notes, setNotes] = useState('');

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (Array.isArray(data)) setClients(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddOpen = () => {
    setSelectedId(null);
    setNomComplet('');
    setTelephone('');
    setEmail('');
    setAdresse('');
    setNotes('');
    open();
  };

  const handleEditOpen = (c: Client) => {
    setSelectedId(c._id || null);
    setNomComplet(c.nomComplet);
    setTelephone(c.telephone);
    setEmail(c.email || '');
    setAdresse(c.adresse || '');
    setNotes(c.notes || '');
    open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { nomComplet, telephone, email, adresse, notes };
    const url = selectedId ? `/api/clients/${selectedId}` : '/api/clients';
    const method = selectedId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchClients();
        close();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir la modal de confirmation de suppression
  const openDeleteModal = (id: string) => {
    setIdToDelete(id);
    setDeleteModalOpened(true);
  };

  // Confirmer l'action de suppression
  const confirmDelete = async () => {
    if (!idToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${idToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchClients();
        setDeleteModalOpened(false);
        setIdToDelete(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = clients.filter((c) =>
    c.nomComplet.toLowerCase().includes(search.toLowerCase()) ||
    c.telephone.includes(search)
  );

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} style={{ letterSpacing: '-0.5px' }}>Répertoire des Clients</Title>
          <Text c="dimmed" size="sm">Gérez la base de données de vos voyageurs</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={handleAddOpen} radius="md">Ajouter un Client</Button>
      </Group>

      <TextInput placeholder="Rechercher par nom ou téléphone..." mb="md" leftSection={<IconSearch size={16} />} value={search} onChange={(e) => setSearch(e.target.value)} radius="md" style={{ maxWidth: 350 }} />

      <Card withBorder shadow="xs" radius="lg" p={0} style={{ overflow: 'hidden' }}>
        <ScrollArea>
          <Table miw={800} verticalSpacing="md" horizontalSpacing="lg" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nom Complet</Table.Th>
                <Table.Th>Téléphone</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Adresse</Table.Th>
                <Table.Th ta="center">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((row) => (
                <Table.Tr key={row._id}>
                  <Table.Td fw={600}>{row.nomComplet}</Table.Td>
                  <Table.Td fw={500} c="blue.7">{row.telephone}</Table.Td>
                  <Table.Td>{row.email || '-'}</Table.Td>
                  <Table.Td>{row.adresse || '-'}</Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="center">
                      <ActionIcon variant="subtle" color="blue" radius="md" onClick={() => handleEditOpen(row)}><IconEdit size={18} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" radius="md" onClick={() => openDeleteModal(row._id!)}><IconTrash size={18} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>

      {/* MODAL CREATION / EDITION */}
      <Modal opened={opened} onClose={close} title={selectedId ? "Modifier la fiche Client" : "Nouveau Client"} centered radius="lg">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput label="Nom complet" placeholder="Nom & Prénoms" required value={nomComplet} onChange={(e) => setNomComplet(e.target.value)} radius="md" />
            <TextInput label="Téléphone" placeholder="Ex: +261 34 XX XX XX" required value={telephone} onChange={(e) => setTelephone(e.target.value)} radius="md" />
            <TextInput label="Email" placeholder="client@exemple.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} radius="md" />
            <TextInput label="Adresse" placeholder="Adresse physique ou Ville" value={adresse} onChange={(e) => setAdresse(e.target.value)} radius="md" />
            <Textarea label="Remarques / Préférences" placeholder="Allergies, demandes spécifiques..." minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} radius="md" />
            <Button type="submit" fullWidth mt="md" radius="md" loading={loading}>Enregistrer le client</Button>
          </Stack>
        </form>
      </Modal>

      {/* MODAL DE SUPPRESSION CLIENTS */}
      <Modal opened={deleteModalOpened} onClose={() => setDeleteModalOpened(false)} centered radius="md" size="sm" withCloseButton={false}>
        <Group gap="sm" mb="md">
          <IconAlertTriangle size={24} color="var(--mantine-color-red-6)" />
          <Text fw={700} size="lg">Supprimer le client ?</Text>
        </Group>
        <Text size="sm" c="dimmed" mb="xl">
          Êtes-vous certain de vouloir supprimer définitivement ce profil voyageur ? Les dossiers d'historiques financiers et réservations déjà enregistrés resteront intacts.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="light" color="gray" radius="md" onClick={() => setDeleteModalOpened(false)}>Annuler</Button>
          <Button color="red" radius="md" onClick={confirmDelete} loading={loading}>Supprimer</Button>
        </Group>
      </Modal>
    </Container>
  );
}