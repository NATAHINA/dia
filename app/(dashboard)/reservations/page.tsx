'use client';

import { useState, useEffect } from 'react';
import { 
  Container, Title, Text, Card, Table, ScrollArea, Badge, Autocomplete,
  Button, Group, ActionIcon, Modal, TextInput, NumberInput, Stack, Select, Alert,
  Pagination, Menu
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconPlus, IconEdit, IconTrash, IconSearch, IconAlertTriangle, IconInfoCircle,
  IconDownload, IconFileTypeXls, IconFileTypePdf, IconChevronDown 
} from '@tabler/icons-react';
import * as XLSX from 'xlsx';
import { generatePDF } from '@/components/GeneratePDF';

// Interfaces inchangées ...
interface Reservation {
  _id?: string;
  date: string;
  client: string;
  circuit: string;
  nbPersonnes: number;
  montant: number;
  acompte: number;
  solde: number;
  statut: 'Confirmé' | 'En attente' | 'Annulé';
  nouveauClient: 'Oui' | 'Non';
}
interface CircuitDB { _id?: string; nom: string; prixStandard: number; }
interface ClientDB { _id?: string; nomComplet: string; }

export default function ReservationsCRUDPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [search, setSearch] = useState('');
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);

  // Pagination
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 10;

  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  const [clientsOptions, setClientsOptions] = useState<ClientDB[]>([]);
  const [circuitsOptions, setCircuitsOptions] = useState<CircuitDB[]>([]);

  // Form State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [client, setClient] = useState<string>('');
  const [circuit, setCircuit] = useState<string>('');
  const [nbPersonnes, setNbPersonnes] = useState<number>(1);
  const [montant, setMontant] = useState<number>(0);
  const [acompte, setAcompte] = useState<number>(0);
  const [statut, setStatut] = useState<string | null>('En attente');
  const [nouveauClient, setNouveauClient] = useState<string | null>('Oui');

  // NOUVEAUX ÉTATS : Pour la gestion des places restantes
  const [infoDispo, setInfoDispo] = useState<{
    statut: string;
    placesRestantes: number;
    message?: string;
  } | null>(null);
  const [verifiantDispo, setVerifiantDispo] = useState(false);

  const fetchData = async () => {
    try {
      const resReservations = await fetch('/api/reservations');
      const dataReservations = await resReservations.json();
      if (Array.isArray(dataReservations)) setReservations(dataReservations);

      const resClients = await fetch('/api/clients');
      const dataClients = await resClients.json();
      if (Array.isArray(dataClients)) setClientsOptions(dataClients);

      const resCircuits = await fetch('/api/circuits');
      const dataCircuits = await resCircuits.json();
      if (Array.isArray(dataCircuits)) setCircuitsOptions(dataCircuits);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleExportExcel = () => {
    const data = filtered.map(r => ({
      'Date': new Date(r.date).toLocaleDateString('fr-FR'),
      'Client': r.client,
      'Circuit': r.circuit,
      'Pax': r.nbPersonnes,
      'Montant': r.montant,
      'Acompte': r.acompte,
      'Solde': r.montant - r.acompte,
      'Statut': r.statut
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Réservations");
    XLSX.writeFile(wb, `Reservations_DiaTravel_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  
  // EFFET : Vérifie la disponibilité dès que la date ou le circuit change
  useEffect(() => {
    const verifierPlacesDisponibles = async () => {
      if (!date || !circuit.trim()) {
        setInfoDispo(null);
        return;
      }
      setVerifiantDispo(true);
      try {
        const res = await fetch(`/api/departs/dispo?circuit=${encodeURIComponent(circuit)}&date=${date}`);
        if (res.ok) {
          const data = await res.json();
          setInfoDispo(data);
        }
      } catch (err) {
        console.error('Erreur vérification dispo:', err);
      } finally {
        setVerifiantDispo(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      verifierPlacesDisponibles();
    }, 500); // Anti-rebond pour éviter d'appeler l'API à chaque lettre tapée

    return () => clearTimeout(delayDebounce);
  }, [date, circuit]);

  const soldeFormulaire = Number(montant) - Number(acompte);

  const handleAddOpen = () => {
    setSelectedId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setClient('');
    setCircuit('');
    setNbPersonnes(1);
    setMontant(0);
    setAcompte(0);
    setStatut('En attente');
    setNouveauClient('Oui');
    setInfoDispo(null);
    open();
  };

  const handleEditOpen = (res: Reservation) => {
    setSelectedId(res._id || null);
    setDate(res.date.split('T')[0]);
    setClient(res.client);
    setCircuit(res.circuit);
    setNbPersonnes(res.nbPersonnes);
    setMontant(res.montant);
    setAcompte(res.acompte);
    setStatut(res.statut);
    setNouveauClient(res.nouveauClient);
    open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // SÉCURITÉ : Bloquer la saisie si le nombre de passagers dépasse les places restantes
    if (infoDispo && infoDispo.statut === 'Disponible' && nbPersonnes > infoDispo.placesRestantes) {
      alert(`⚠️ Action impossible : Il ne reste plus que ${infoDispo.placesRestantes} place(s) disponible(s) sur ce départ.`);
      return;
    }
    if (infoDispo && infoDispo.statut === 'Non planifié') {
      alert("⚠️ Action impossible : Aucun départ n'est configuré dans votre planning pour ce circuit à cette date.");
      return;
    }

    setLoading(true);
    const clientFinal = client.trim();
    const circuitFinal = circuit.trim();

    try {
      // 1. Insertion client automatique ...
      if (clientFinal) {
        const clientExiste = clientsOptions.find(c => c?.nomComplet?.toLowerCase().trim() === clientFinal.toLowerCase());
        if (!clientExiste) {
          await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nomComplet: clientFinal, telephone: '-' }),
          });
        }
      }

      // 2. Insertion circuit automatique ...
      if (circuitFinal) {
        const circuitExiste = circuitsOptions.find(c => c?.nom?.toLowerCase().trim() === circuitFinal.toLowerCase());
        if (!circuitExiste) {
          await fetch('/api/circuits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom: circuitFinal, prixStandard: Number(montant) / (Number(nbPersonnes) || 1), capaciteMax: 50 }),
          });
        }
      }

      // 3. Enregistrement Réservation
      const payload = {
        date, client: clientFinal, circuit: circuitFinal,
        nbPersonnes: Number(nbPersonnes), montant: Number(montant),
        acompte: Number(acompte), solde: soldeFormulaire, statut, nouveauClient
      };

      const url = selectedId ? `/api/reservations/${selectedId}` : '/api/reservations';
      const method = selectedId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchData();
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


  const confirmDelete = async () => {
    if (!idToDelete) return;
    setLoading(true);
    try {
      // Modification de l'URL pour pointer vers l'API des réservations
      const res = await fetch(`/api/reservations/${idToDelete}`, { method: 'DELETE' });
      
      if (res.ok) {
        await fetchData(); // Recharge la liste à l'écran
        setDeleteModalOpened(false);
        setIdToDelete(null);
      } else {
        alert("Impossible de supprimer cette réservation.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  const filtered = reservations.filter((r) => 
    r.circuit.toLowerCase().includes(search.toLowerCase()) ||
    (r.client && r.client.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => setActivePage(1), [search]);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

  return (
    <Container size="xl" py="md">
      
      <Group justify="space-between" mb="xl" className="no-print">
        <div>
          <Title order={2}>Suivi des Réservations</Title>
          <Text c="dimmed" size="sm">Gestion des dossiers clients, acomptes et soldes</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={handleAddOpen} radius="md">Nouvelle Réservation</Button>
      </Group>

      <Group justify="space-between" mb="md" className="no-print">
        <TextInput placeholder="Rechercher par client ou circuit..." leftSection={<IconSearch size={16} />} value={search} onChange={(e) => setSearch(e.target.value)} radius="md" style={{ flex: 1, maxWidth: 400 }} />
        
        <Menu position="bottom-end">
          <Menu.Target>
            <Button variant="light" color="gray" leftSection={<IconDownload size={16} />} rightSection={<IconChevronDown size={14} />}>Exporter</Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconFileTypeXls size={16} color="green"/>} onClick={handleExportExcel}>Excel</Menu.Item>
            <Menu.Item leftSection={<IconFileTypePdf size={16} color="red"/>} onClick={() => generatePDF(reservations)}>Imprimer PDF</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      
      <Card withBorder shadow="sm" radius="lg" p={0}>
        <ScrollArea>
          <Table miw={1000} verticalSpacing="md" horizontalSpacing="md" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Client</Table.Th>
                <Table.Th>Circuit</Table.Th>
                <Table.Th ta="center">Pax</Table.Th>
                <Table.Th ta="right">Montant</Table.Th>
                <Table.Th ta="right">Acompte</Table.Th>
                <Table.Th ta="right">Solde</Table.Th>
                <Table.Th ta="center">Statut</Table.Th>
                <Table.Th ta="center" className="no-print">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginated.map(row => (
                <Table.Tr key={row._id}>
                  <Table.Td>{new Date(row.date).toLocaleDateString('fr-FR')}</Table.Td>
                  <Table.Td fw={600}>{row.client}</Table.Td>
                  <Table.Td c="blue.7">{row.circuit}</Table.Td>
                  <Table.Td ta="center">{row.nbPersonnes}</Table.Td>
                  <Table.Td ta="right">{row.montant.toLocaleString('fr-FR').replace(/\s/g, ' / ')} Ar</Table.Td>
                  <Table.Td ta="right" c="green.7">{row.acompte.toLocaleString()} Ar</Table.Td>
                  <Table.Td ta="right" fw={700} c={(row.montant - row.acompte) > 0 ? 'red.6' : 'gray.5'}>{(row.montant - row.acompte).toLocaleString()} Ar</Table.Td>
                  <Table.Td ta="center"><Badge color={row.statut === 'Confirmé' ? 'green' : 'orange'}>{row.statut}</Badge></Table.Td>
                  <Table.Td className="no-print">
                    <Group gap="xs" justify="center">
                      <ActionIcon variant="subtle" color="blue" onClick={() => handleEditOpen(row)}><IconEdit size={18} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" onClick={() => openDeleteModal(row._id!)}><IconTrash size={18} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>

      {totalPages > 1 && (
        <Group justify="center" mt="xl" className="no-print">
          <Pagination total={totalPages} value={activePage} onChange={setActivePage} />
        </Group>
      )}

      {/* MODAL AJOUT / ÉDITION */}
      <Modal opened={opened} onClose={close} title={selectedId ? "Modifier la Réservation" : "Créer une Réservation"} centered radius="lg" size="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput label="Date de réservation" type="date" required value={date} onChange={(e) => setDate(e.target.value)} radius="md" />
            
            <Autocomplete
              label="Circuit / Destination"
              placeholder="Sélectionner la destination..."
              required
              data={circuitsOptions.map(c => c?.nom || '').filter(Boolean)}
              value={circuit}
              onChange={(val) => {
                setCircuit(val);
                const circuitTrouve = circuitsOptions.find(c => c?.nom?.toLowerCase().trim() === val.toLowerCase().trim());
                if (circuitTrouve) setMontant((circuitTrouve.prixStandard || 0) * nbPersonnes);
              }}
              radius="md"
            />

            {/* BLOC VISUEL INDICATEUR DE DISPONIBILITÉ DES PLACES */}
            {verifiantDispo && <Text size="xs" c="dimmed">Analyse du planning en cours...</Text>}
            
            {infoDispo && !verifiantDispo && (
              infoDispo.statut === 'Disponible' ? (
                <Alert icon={<IconInfoCircle size={16} />} title="État des places sur ce départ" color={infoDispo.placesRestantes >= nbPersonnes ? "green" : "red"} radius="md">
                  Places restantes : <b>{infoDispo.placesRestantes}</b>
                  {nbPersonnes > infoDispo.placesRestantes && (
                    <Text size="xs" fw={700} mt="xs" c="red.7">⚠️ Le nombre de voyageurs (Pax) choisi dépasse la capacité restante !</Text>
                  )}
                </Alert>
              ) : (
                <Alert icon={<IconAlertTriangle size={16} />} title="Départ non planifié" color="orange" radius="md">
                  {infoDispo.message}
                </Alert>
              )
            )}

            <Autocomplete
              label="Nom du Client"
              placeholder="Sélectionner ou saisir un client"
              required
              data={clientsOptions.map(o => o?.nomComplet || '').filter(Boolean)}
              value={client}
              onChange={(val) => {
                setClient(val);
                const existe = clientsOptions.some(o => o?.nomComplet?.toLowerCase().trim() === val.toLowerCase().trim());
                setNouveauClient(existe ? 'Non' : 'Oui');
              }}
              radius="md"
            />

            <Group grow>
              <NumberInput 
                label="Nombre de personnes (Pax)" 
                min={1} 
                value={nbPersonnes} 
                onChange={(val) => {
                  const paxs = Number(val) || 1;
                  setNbPersonnes(paxs);
                  const circuitTrouve = circuitsOptions.find(c => c?.nom?.toLowerCase().trim() === circuit.toLowerCase().trim());
                  if (circuitTrouve) setMontant((circuitTrouve.prixStandard || 0) * paxs);
                }} 
                radius="md" 
                error={infoDispo && infoDispo.statut === 'Disponible' && nbPersonnes > infoDispo.placesRestantes}
              />
              <Select label="Nouveau client ?" data={['Oui', 'Non']} value={nouveauClient} disabled radius="md" />
            </Group>

            <NumberInput label="Montant Total Contractuel (Ar)" min={0} value={montant} onChange={(val) => setMontant(Number(val) || 0)} radius="md" thousandSeparator=" " />
            <NumberInput label="Acompte Versé (Ar)" min={0} value={acompte} onChange={(val) => setAcompte(Number(val) || 0)} radius="md" thousandSeparator=" " />
            
            <Group justify="space-between" bg="gray.0" p="xs" style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px dashed var(--mantine-color-gray-3)' }}>
              <Text size="sm" fw={500}>Calcul du Solde Restant :</Text>
              <Text fw={700} c={soldeFormulaire > 0 ? 'red.6' : 'green.6'}>{soldeFormulaire.toLocaleString()} Ar</Text>
            </Group>

            <Select label="Statut du dossier" data={['Confirmé', 'En attente', 'Annulé']} value={statut} onChange={(val) => setStatut(val || 'En attente')} radius="md" />

            <Button 
              type="submit" 
              fullWidth 
              mt="md" 
              radius="md" 
              loading={loading} 
              disabled={
                infoDispo?.statut === 'Non planifié' || 
                !!(infoDispo && nbPersonnes > infoDispo.placesRestantes)
              }
            >
              Sauvegarder la réservation
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Modal suppression... */}
      <Modal opened={deleteModalOpened} onClose={() => setDeleteModalOpened(false)} centered radius="md" size="sm" withCloseButton={false}>
        <Group gap="sm" mb="md">
          <IconAlertTriangle size={24} color="var(--mantine-color-red-6)" />
          <Text fw={700} size="lg">Confirmer la suppression</Text>
        </Group>
        
        <Text size="sm" c="dimmed" mb="xl">Êtes-vous sûr de vouloir supprimer définitivement cette réservation ?</Text>
        
        <Group justify="flex-end" gap="sm">
          <Button variant="light" color="gray" radius="md" onClick={() => setDeleteModalOpened(false)} disabled={loading}>
            Annuler
          </Button>
          {/* Ajout du onClick et du loading state ici */}
          <Button color="red" radius="md" onClick={confirmDelete} loading={loading}>
            Supprimer
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}

