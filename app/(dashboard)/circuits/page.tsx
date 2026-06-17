'use client';

import { useState, useEffect } from 'react';
import { 
  Container, Title, Text, Card, Table, ScrollArea, Button, 
  Group, ActionIcon, Modal, TextInput, NumberInput, Stack, Textarea 
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconAlertTriangle } from '@tabler/icons-react';

interface Circuit {
  _id?: string;
  nom: string;
  description: string;
  prixStandard: number;
  dureeJours: number;
  capaciteMax: number;
}

export default function CircuitsPage() {
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [search, setSearch] = useState('');
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);

  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [prixStandard, setPrixStandard] = useState<number | string>(0);
  const [capaciteMax, setCapaciteMax] = useState<number | string>(1);
  const [dureeJours, setDureeJours] = useState<number | string>(1);

  const fetchCircuits = async () => {
    try {
      const res = await fetch('/api/circuits');
      const data = await res.json();
      if (Array.isArray(data)) setCircuits(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCircuits();
  }, []);

  const handleAddOpen = () => {
    setSelectedId(null);
    setNom('');
    setCapaciteMax(1);
    setDescription('');
    setPrixStandard(0);
    setDureeJours(1);
    open();
  };

  const handleEditOpen = (c: Circuit) => {
    setSelectedId(c._id || null);
    setNom(c.nom);
    setDescription(c.description || '');
    setPrixStandard(c.prixStandard);
    setCapaciteMax(c.capaciteMax);
    setDureeJours(c.dureeJours);
    open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { nom, description, prixStandard: Number(prixStandard),capaciteMax: Number(capaciteMax), dureeJours: Number(dureeJours) };
    const url = selectedId ? `/api/circuits/${selectedId}` : '/api/circuits';
    const method = selectedId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchCircuits();
        close();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (id: string) => {
    setIdToDelete(id);
    setDeleteModalOpened(true);
  };

  // Confirmer l'action de suppression
  const confirmDelete = async () => {
    if (!idToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/circuits/${idToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchCircuits();
        setDeleteModalOpened(false);
        setIdToDelete(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = circuits.filter((c) => c.nom.toLowerCase().includes(search.toLowerCase()));

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} style={{ letterSpacing: '-0.5px' }}>Configuration des Circuits</Title>
          <Text c="dimmed" size="sm">Gériez le catalogue des voyages disponibles</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={handleAddOpen} radius="md">Ajouter un Circuit</Button>
      </Group>

      <TextInput placeholder="Rechercher un circuit..." mb="md" leftSection={<IconSearch size={16} />} value={search} onChange={(e) => setSearch(e.target.value)} radius="md" style={{ maxWidth: 350 }} />

      <Card withBorder shadow="xs" radius="lg" p={0} style={{ overflow: 'hidden' }}>
        <ScrollArea>
          <Table miw={800} verticalSpacing="md" horizontalSpacing="lg" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nom du Circuit</Table.Th>
                <Table.Th>Durée (Jours)</Table.Th>
                <Table.Th>Capacité Max.</Table.Th>
                <Table.Th ta="right">Prix Standard</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th ta="center">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((row) => (
                <Table.Tr key={row._id}>
                  <Table.Td fw={600} c="blue.7">{row.nom}</Table.Td>
                  <Table.Td>{row.dureeJours} jours</Table.Td>
                  <Table.Td fw={600}>{row.capaciteMax}</Table.Td>
                  <Table.Td ta="right" fw={600}>{row.prixStandard.toLocaleString()} Ar</Table.Td>
                  <Table.Td style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.description || '-'}</Table.Td>
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

      <Modal opened={opened} onClose={close} title={selectedId ? "Modifier le Circuit" : "Créer un Circuit"} centered radius="lg">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput label="Nom du Circuit" placeholder="Ex: Grand Sud - Tuléar" required value={nom} onChange={(e) => setNom(e.target.value)} radius="md" />
            <Group grow>
              <NumberInput label="Durée (en jours)" min={1} value={dureeJours} onChange={(val) => setDureeJours(val || 1)} required radius="md" />
              <NumberInput label="Prix Standard (Ar)" min={0} value={prixStandard} onChange={(val) => setPrixStandard(val || 0)} required radius="md" />
            </Group>
            <NumberInput label="Capacité max." min={1} value={capaciteMax} onChange={(val) => setCapaciteMax(val || 1)} required radius="md" />
            <Textarea label="Description" placeholder="Détails de l'itinéraire..." minRows={3} value={description} onChange={(e) => setDescription(e.target.value)} radius="md" />
            <Button type="submit" fullWidth mt="md" radius="md" loading={loading}>Enregistrer</Button>
          </Stack>
        </form>
      </Modal>

      <Modal opened={deleteModalOpened} onClose={() => setDeleteModalOpened(false)} centered radius="md" size="sm" withCloseButton={false}>
        <Group gap="sm" mb="md">
          <IconAlertTriangle size={24} color="var(--mantine-color-red-6)" />
          <Text fw={700} size="lg">Supprimer le circuit ?</Text>
        </Group>
        <Text size="sm" c="dimmed" mb="xl">
          Êtes-vous sûr de vouloir retirer ce circuit du catalogue ? Les départs planifiés utilisant ce nom ne seront pas effacés automatiquement.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="light" color="gray" radius="md" onClick={() => setDeleteModalOpened(false)}>Annuler</Button>
          <Button color="red" radius="md" onClick={confirmDelete} loading={loading}>Supprimer</Button>
        </Group>
      </Modal>
    </Container>
  );
}