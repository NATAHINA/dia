'use client';

import { useState, useEffect } from 'react';
import { 
  Container, Title, Text, Card, Table, ScrollArea, Badge, 
  Button, Group, ActionIcon, Modal, TextInput, NumberInput, Stack,
  Pagination, Menu, Divider, Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconPlus, IconEdit, IconTrash, IconSearch, IconAlertTriangle, IconRefresh,
  IconDownload, IconFileTypeXls, IconFileTypePdf, IconChevronDown 
} from '@tabler/icons-react';
import * as XLSX from 'xlsx';
import { generateMarketingPDF } from '@/components/MarketingPDF';

interface Campaign {
  _id?: string;
  date: string;
  publication: string;
  portee: number;
  messages: number;
  reservationsObtenues: number;
  score: number;
}

export default function MarketingCRUDPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [search, setSearch] = useState('');
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);

  // ÉTATS POUR LA PAGINATION
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 10; // Nombre de lignes par page

  // ÉTATS POUR LA MODAL DE SUPPRESSION
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  // Form State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [publication, setPublication] = useState('');
  const [date, setDate] = useState('');
  const [portee, setPortee] = useState<number | string>(0);
  const [messages, setMessages] = useState<number | string>(0);
  const [reservationsObtenues, setReservationsObtenues] = useState<number | string>(0);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/marketing');
      const data = await res.json();
      if (Array.isArray(data)) setCampaigns(data);
    } catch (err) {
      console.error('Erreur de chargement:', err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Réinitialiser la page à 1 lors d'une recherche
  useEffect(() => {
    setActivePage(1);
  }, [search]);

  const handleAddOpen = () => {
    setSelectedId(null);
    setPublication('');
    setDate(new Date().toISOString().split('T')[0]);
    setPortee(0);
    setMessages(0);
    setReservationsObtenues(0);
    open();
  };

  const handleEditOpen = (campaign: Campaign) => {
    setSelectedId(campaign._id || null);
    setPublication(campaign.publication);
    setDate(campaign.date.split('T')[0]);
    setPortee(campaign.portee);
    setMessages(campaign.messages);
    setReservationsObtenues(campaign.reservationsObtenues);
    open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      date,
      publication,
      portee: Number(portee),
      messages: Number(messages),
      reservationsObtenues: Number(reservationsObtenues)
    };

    const url = selectedId ? `/api/marketing/${selectedId}` : '/api/marketing';
    const method = selectedId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchCampaigns();
        close();
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
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
      const res = await fetch(`/api/marketing/${idToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchCampaigns();
        setDeleteModalOpened(false);
        setIdToDelete(null);
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // FONCTIONNALITÉ : EXPORT EXCEL (XLSX)
  // -------------------------------------------------------------
  const handleExportExcel = () => {
    // Formater les données pour l'extraction Excel brute
    const dataToExport = filteredCampaigns.map(c => ({
      'Date': new Date(c.date).toLocaleDateString('fr-FR'),
      'Publication / Annonce': c.publication,
      'Portée totale': c.portee,
      'Messages reçus': c.messages,
      'Réservations obtenues': c.reservationsObtenues,
      'Score Performance (pts)': c.score
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Performances Facebook");
    
    // Génération et téléchargement automatique du fichier
    XLSX.writeFile(workbook, `Marketing_Facebook_DiaTravel_${new Date().toISOString().split('T')[0]}.xlsx`);
  };


  // FILTRAGE ET TRAITEMENT DE LA PAGINATION
  const filteredCampaigns = campaigns.filter((c) =>
    c.publication.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  
  // Extraire uniquement les lignes correspondantes à la page courante
  const paginatedCampaigns = filteredCampaigns.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  // const handleSyncMeta = async () => {
  //   setLoading(true);
  //   try {
  //     const res = await fetch('/api/marketing/sync', { method: 'POST' });
  //     if (res.ok) {
  //       await fetchCampaigns(); // Recharger les données après la synchro
  //       alert("Synchronisation réussie !");
  //     } else {
  //       alert("Erreur lors de la synchronisation.");
  //     }
  //   } catch (err) {
  //     console.error('Erreur:', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <Container size="xl" py="md" className="printable-container">
      

      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>Marketing Facebook</Title>
          <Text c="dimmed" size="sm">Suivi des performances et rentabilité des annonces</Text>
        </div>
{/*
        <Group>
          <Button 
            variant="outline" 
            color="blue" 
            leftSection={<IconRefresh size={16} />} 
            onClick={handleSyncMeta} 
            loading={loading}
          >
            Synchroniser Meta
          </Button>
          <Button leftSection={<IconPlus size={16} />} onClick={handleAddOpen} radius="md">
            Ajouter manuellement
          </Button>
        </Group>*/}

        <Button leftSection={<IconPlus size={16} />} onClick={handleAddOpen} radius="md">
          Ajouter une publication
        </Button>
      </Group>

      {/* BARRE D'OUTILS ET RECHERCHE */}
      <Group justify="space-between" mb="md" className="no-print">
        <TextInput
          placeholder="Rechercher une publication..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          radius="md"
          style={{ flex: 1, maxWidth: 400 }}
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
              onClick={() => generateMarketingPDF(campaigns)}
            >
              Imprimer  PDF
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      {/* COMPTEUR DE LIGNES TROUVÉES */}
      <Text size="xs" c="dimmed" mb="xs" className="no-print">
        {filteredCampaigns.length} publication(s) trouvée(s) {search && 'pour cette recherche'}
      </Text>

      <Card withBorder shadow="sm" radius="md" p={0}>
        <ScrollArea>
          <Table miw={800} verticalSpacing="sm" horizontalSpacing="md" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Publication</Table.Th>
                <Table.Th ta="right">Portée</Table.Th>
                <Table.Th ta="center">Messages</Table.Th>
                <Table.Th ta="center">Réservations</Table.Th>
                <Table.Th ta="center">Score</Table.Th>
                <Table.Th ta="center" className="no-print">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedCampaigns.length > 0 ? (
                paginatedCampaigns.map((row) => (
                  <Table.Tr key={row._id}>
                    <Table.Td>{new Date(row.date).toLocaleDateString('fr-FR')}</Table.Td>
                    <Table.Td fw={500}>{row.publication}</Table.Td>
                    <Table.Td ta="right">{row.portee.toLocaleString()}</Table.Td>
                    <Table.Td ta="center" c="blue.7" fw={600}>{row.messages}</Table.Td>
                    <Table.Td ta="center" c="green.7" fw={600}>{row.reservationsObtenues}</Table.Td>
                    <Table.Td ta="center">
                      <Badge color={row.score > 100 ? 'teal' : 'blue'} variant="filled">
                        {row.score} pts
                      </Badge>
                    </Table.Td>
                    <Table.Td className="no-print">
                      <Group gap="xs" justify="center">
                        <ActionIcon variant="light" color="blue" onClick={() => handleEditOpen(row)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon variant="light" color="red" onClick={() => openDeleteModal(row._id!)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={7} ta="center" py="xl" c="dimmed">
                    Aucune publication trouvée.
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>

      {/* COMPOSANT DE PAGINATION MANUELLE */}
      {totalPages > 1 && (
        <Group justify="center" mt="xl" className="no-print">
          <Pagination 
            total={totalPages} 
            value={activePage} 
            onChange={setActivePage} 
            radius="md"
            withEdges
          />
        </Group>
      )}

      {/* MODAL AJOUT / MODIFICATION */}
      <Modal opened={opened} onClose={close} title={selectedId ? "Modifier la Publication" : "Ajouter une Publication"} centered radius="lg" className="no-print">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput label="Date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            <TextInput label="Nom de la Publication" required value={publication} onChange={(e) => setPublication(e.target.value)} />
            <NumberInput label="Portée" min={0} value={portee} onChange={(val) => setPortee(val || 0)} />
            <NumberInput label="Nombre de Messages" min={0} value={messages} onChange={(val) => setMessages(val || 0)} />
            <NumberInput label="Réservations Obtenues" min={0} value={reservationsObtenues} onChange={(val) => setReservationsObtenues(val || 0)} />
            <Button type="submit" fullWidth mt="md" loading={loading}>Sauvegarder</Button>
          </Stack>
        </form>
      </Modal>

      {/* MODAL DE SUPPRESSION */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title={
          <Group gap="xs">
            <IconAlertTriangle size={20} color="var(--mantine-color-red-6)" />
            <Text fw={700}>Confirmer la suppression</Text>
          </Group>
        }
        centered
        radius="md"
        size="sm"
        className="no-print"
      >
        <Text size="sm" mb="xl">
          Êtes-vous sûr de vouloir supprimer définitivement cette publication ? Cette action est irréversible.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="light" color="gray" onClick={() => setDeleteModalOpened(false)}>
            Annuler
          </Button>
          <Button color="red" onClick={confirmDelete} loading={loading}>
            Supprimer
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}