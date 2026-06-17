'use client';

import { useState, useEffect } from 'react';
import {
  Container, Title, Text, Card, Table, ScrollArea, Badge, Autocomplete,
  Button, Group, ActionIcon, Modal, TextInput, NumberInput, Stack, Menu,
  Divider, Tooltip 
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconAlertTriangle } from '@tabler/icons-react';
import * as XLSX from 'xlsx';
import { generateDepartsPDF } from '@/components/DepartsPDF'; // Voir étape 3
import { IconDownload, IconFileTypeXls, IconFileTypePdf, IconChevronDown } from '@tabler/icons-react';

interface Depart {
  _id?: string;
  dateDepart: string;
  circuit: string;
  client?: string;
  placesDisponibles: number;
  placesVendues: number;
  tauxRemplissage: number;
}

interface CircuitDB {
  nom: string;
  capaciteMax?: number;
}

interface ClientDB {
  _id?: string;
  nomComplet: string;
}

export default function DepartsCRUDPage() {
  const [departs, setDeparts] = useState<Depart[]>([]);
  const [circuitsOptions, setCircuitsOptions] = useState<CircuitDB[]>([]);
  const [clientsOptions, setClientsOptions] = useState<ClientDB[]>([]);
  const [search, setSearch] = useState('');
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);

  // Modal de suppression
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  // Form State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dateDepart, setDateDepart] = useState('');
  const [circuit, setCircuit] = useState('');
  const [client, setClient] = useState('');
  const [placesDisponibles, setPlacesDisponibles] = useState<number>(0);
  const [placesVendues, setPlacesVendues] = useState<number>(0);

  // Chargement des Départs, Circuits ET Clients de référence
  const fetchData = async () => {
    try {
      const resDeparts = await fetch('/api/departs');
      const dataDeparts = await resDeparts.json();
      if (Array.isArray(dataDeparts)) setDeparts(dataDeparts);

      const resCircuits = await fetch('/api/circuits');
      const dataCircuits = await resCircuits.json();
      if (Array.isArray(dataCircuits)) setCircuitsOptions(dataCircuits);

      const resClients = await fetch('/api/clients');
      const dataClients = await resClients.json();
      if (Array.isArray(dataClients)) setClientsOptions(dataClients);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddOpen = () => {
    setSelectedId(null);
    setDateDepart(new Date().toISOString().split('T')[0]);
    setCircuit('');
    setClient('');
    setPlacesDisponibles(0);
    setPlacesVendues(0);
    open();
  };

  const handleEditOpen = (dep: Depart) => {
    setSelectedId(dep._id || null);
    setDateDepart(dep.dateDepart ? dep.dateDepart.split('T')[0] : '');
    setCircuit(dep.circuit);
    setClient(dep.client || '');
    setPlacesDisponibles(dep.placesDisponibles);
    setPlacesVendues(dep.placesVendues || 0);
    open();
  };

  // EXPORT EXCEL
  const handleExportExcel = () => {
    const dataToExport = filtered.map(d => ({
      'Date': new Date(d.dateDepart).toLocaleDateString('fr-FR'),
      'Circuit': d.circuit,
      'Client': d.client || 'Non assigné',
      'Capacité': d.placesDisponibles,
      'Places Vendues': d.placesVendues,
      'Taux Remplissage (%)': d.tauxRemplissage
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Planning Départs");
    XLSX.writeFile(workbook, `Planning_Departs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const clientFinal = client.trim();

    try {
      // 1. VERIFICATION ET INSERTION AUTOMATIQUE DU CLIENT S'IL N'EXISTE PAS
      if (clientFinal) {
        const clientExiste = clientsOptions.find(
          (c) => c?.nomComplet?.toLowerCase().trim() === clientFinal.toLowerCase()
        );

        if (!clientExiste) {
          console.log(`Création automatique du client : ${clientFinal}`);
          const resNewClient = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              nomComplet: clientFinal,
              telephone: '-', // Valeur temporaire si ton modèle exige ce champ
            }),
          });

          if (!resNewClient.ok) {
            const errorData = await resNewClient.json();
            throw new Error(`Impossible de créer le client automatique : ${errorData.error || errorData.message || 'Erreur inconnue'}`);
          }
        }
      }

      // 2. PREPARATION DU PAYLOAD POUR LE DEPART
      const payload = {
        dateDepart,
        circuit,
        client: clientFinal,
        placesDisponibles: Number(placesDisponibles),
        // Laisse placesVendues vide ou non envoyé à la création si ton backend le recalcule automatiquement
      };

      const url = selectedId ? `/api/departs/${selectedId}` : '/api/departs';
      const method = selectedId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchData(); // Recharge la vue et la liste des options clients mise à jour
        close();
      } else {
        const errorData = await res.json();
        alert(`Erreur lors de l'enregistrement du départ : ${errorData.error || errorData.message || 'Erreur serveur'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Erreur réseau ou critique : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (id: string) => {
    setIdToDelete(id);
    setDeleteModalOpened(true);
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/departs/${idToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
        setDeleteModalOpened(false);
        setIdToDelete(null);
      } else {
        alert("Impossible de supprimer ce départ.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = departs.filter((d) =>
    d.circuit.toLowerCase().includes(search.toLowerCase()) ||
    (d.client && d.client.toLowerCase().includes(search.toLowerCase()))
  );

  const getRemplissageStyle = (taux: number) => {
    if (taux > 80) return { color: 'green', label: '🟢 Excellent' };
    if (taux >= 50) return { color: 'yellow', label: '🟡 Moyen' };
    return { color: 'red', label: '🔴 Critique' };
  };

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} style={{ letterSpacing: '-0.5px' }}>Planning des Départs</Title>
          <Text c="dimmed" size="sm">Suivi dynamique du taux de remplissage des circuits</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={handleAddOpen} radius="md">
          Ajouter un Départ
        </Button>
      </Group>

      <Group justify="space-between" mb="md" className="no-print">
        <TextInput
          placeholder="Rechercher par circuit ou client..."
          mb="md"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          radius="md"
          style={{ maxWidth: 400 }}
        />


        {/* MENU DÉROULANT DES EXPORTS EXCEL / PDF */}
        <Menu shadow="md" width={200} radius="md" position="bottom-end">
          <Menu.Target>
            <Button 
              variant="light" 
              color="gray" 
              leftSection={<IconDownload size={16} />}
              rightSection={<IconChevronDown size={14} />}
            >
              Exporter
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Formats disponibles</Menu.Label>
            <Menu.Item 
              leftSection={<IconFileTypeXls size={16} color="var(--mantine-color-green-6)" />}
              onClick={handleExportExcel}
            >
             Excel
            </Menu.Item>
            <Menu.Item 
              leftSection={<IconFileTypePdf size={16} color="var(--mantine-color-red-6)" />}
              onClick={() => generateDepartsPDF(filtered)}
            >
              Imprimer  PDF
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      
      <Card withBorder shadow="sm" radius="lg" p={0} style={{ overflow: 'hidden' }}>
        <ScrollArea>
          <Table miw={900} verticalSpacing="md" horizontalSpacing="md" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date Départ</Table.Th>
                <Table.Th>Circuit</Table.Th>
                <Table.Th>Client</Table.Th>
                <Table.Th ta="center">Places Max (Capacité)</Table.Th>
                <Table.Th ta="center">Places Vendues</Table.Th>
                <Table.Th ta="center">Taux de Remplissage</Table.Th>
                <Table.Th ta="center">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.length > 0 ? (
                filtered.map((row) => {
                  const config = getRemplissageStyle(row.tauxRemplissage);
                  return (
                    <Table.Tr key={row._id}>
                      <Table.Td>{row.dateDepart ? new Date(row.dateDepart).toLocaleDateString('fr-FR') : '-'}</Table.Td>
                      <Table.Td fw={600} c="gray.8">{row.circuit}</Table.Td>
                      <Table.Td fw={500} c="blue.8">{row.client || 'Non assigné'}</Table.Td>
                      <Table.Td ta="center" fw={600}>{row.placesDisponibles}</Table.Td>
                      <Table.Td ta="center" c="blue.7" fw={600}>{row.placesVendues}</Table.Td>
                      <Table.Td ta="center">
                        <Badge color={config.color} variant="filled" size="lg" style={{ minWidth: 110 }}>
                          {row.tauxRemplissage}%
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" justify="center">
                          <ActionIcon variant="subtle" color="blue" radius="md" onClick={() => handleEditOpen(row)}>
                            <IconEdit size={18} />
                          </ActionIcon>
                          <ActionIcon variant="subtle" color="red" radius="md" onClick={() => openDeleteModal(row._id!)}>
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={7} ta="center" py="xl" c="dimmed">
                    Aucun départ planifié.
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>

      {/* MODAL AJOUT / ÉDITION */}
      <Modal opened={opened} onClose={close} title={selectedId ? "Modifier le Départ" : "Planifier un Départ"} centered radius="lg" size="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput label="Date de Départ" type="date" required value={dateDepart} onChange={(e) => setDateDepart(e.target.value)} radius="md" />
            
            <Autocomplete
              label="Circuit"
              placeholder="Sélectionner ou saisir une destination..."
              required
              data={Array.isArray(circuitsOptions) ? circuitsOptions.map(c => c?.nom || '').filter(Boolean) : []}
              value={circuit}
              onChange={(val) => {
                setCircuit(val);
                const circuitAssocie = circuitsOptions.find(
                  c => c?.nom?.toLowerCase().trim() === val.toLowerCase().trim()
                );
                if (circuitAssocie) {
                  setPlacesDisponibles(circuitAssocie.capaciteMax || 0);
                }
              }}
              radius="md"
            />

            <Autocomplete
              label="Client"
              placeholder="Rechercher un client ou en saisir un nouveau..."
              required
              data={Array.isArray(clientsOptions) ? clientsOptions.map(cl => cl?.nomComplet || '').filter(Boolean) : []}
              value={client}
              onChange={setClient}
              radius="md"
            />

            <NumberInput 
              label="Total de Places Disponibles (Capacité)" 
              min={0} 
              value={placesDisponibles} 
              onChange={(val) => setPlacesDisponibles(Number(val) || 0)} 
              required 
              radius="md" 
            />
            
            <NumberInput 
              label="Nombre de Places Vendues (Automatique)" 
              disabled
              min={0} 
              value={placesVendues} 
              onChange={(val) => setPlacesVendues(Number(val) || 0)} 
              radius="md" 
            />
            
            <Button type="submit" fullWidth mt="md" radius="md" loading={loading}>
              Sauvegarder le départ
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* MODAL DE CONFIRMATION DE SUPPRESSION */}
      <Modal opened={deleteModalOpened} onClose={() => setDeleteModalOpened(false)} centered radius="md" size="sm" withCloseButton={false}>
        <Group gap="sm" mb="md">
          <IconAlertTriangle size={24} color="var(--mantine-color-red-6)" />
          <Text fw={700} size="lg">Confirmer la suppression</Text>
        </Group>
        <Text size="sm" c="dimmed" mb="xl">
          Êtes-vous sûr de vouloir retirer ce départ du planning ? Cette action est irréversible.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="light" color="gray" radius="md" onClick={() => setDeleteModalOpened(false)}>
            Annuler
          </Button>
          <Button color="red" radius="md" onClick={confirmDelete} loading={loading}>
            Confirmer la suppression
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}