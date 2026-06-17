'use client';

import { useState, useEffect } from 'react';
import { Card, Text, SimpleGrid, Group, Title, Container, Badge, ThemeIcon, Loader, Center, Select, Stack, Table, Progress, Grid, ActionIcon, NumberInput, Flex } from '@mantine/core';
import { BarChart, LineChart } from '@mantine/charts';
import { IconTrendingUp, IconUsers, IconCalendar, IconCurrencyDollar, IconBrandFacebook, IconMessageCircle, IconTarget, IconAward, IconEdit, IconCheck } from '@tabler/icons-react';

interface DashboardData {
  kpis: {
    caMois: number;
    soldeMois: number;
    voyageursMois: number;
    caGlobal: number;
    soldeGlobalTotal: number;
    totalReservationsMois: number;
    nouveauxClientsMois: number;
    totalDepartsMois: number;
    tauxRemplissageMoyen: number;
    nbClientsTotal: number;
    clientsFideles: number;
    facebookMessages: number;
    facebookVentes: number;
    tauxTransformation: number;
    objectifMois: number;
  };
  topDestinations: Array<{ circuit: string; nbClients: number; ca: number }>;
  performanceCharts: Array<{ month: string; Realisation: number; Objectif: number; Voyageurs: number }>;
  // CORRECTION ICI : 'portee' est une string formatée par l'API arrière-plan
  publicationsPerformantes: Array<{ titre: string; messages: number; ventes: number; portee: string }>;
}

export default function DashboardPage() {
  const [moisSelectionne, setMoisSelectionne] = useState<string | null>('6'); // Juin par défaut
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // États locaux dédiés à la modification manuelle de l'objectif
  const [enTrainDEditer, setEnTrainDEditer] = useState(false);
  const [nouvelObjectif, setNouvelObjectif] = useState<number>(50000000);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?month=${moisSelectionne}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
        // Initialiser la valeur du champ d'édition avec l'objectif récupéré
        if (result?.kpis?.objectifMois) {
          setNouvelObjectif(result.kpis.objectifMois);
        }
      }
    } catch (err) {
      console.error('Erreur data dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    setEnTrainDEditer(false);
  }, [moisSelectionne]);

  // Fonction pour soumettre l'objectif modifié manuellement au serveur
  const sauvegarderObjectifManuel = async () => {
    try {
      const res = await fetch('/api/objectifs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mois: parseInt(moisSelectionne || '6', 10), 
          montant: nouvelObjectif 
        })
      });
      if (res.ok) {
        setEnTrainDEditer(false);
        // Rafraîchir les données globales pour synchroniser les graphiques et KPI
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Erreur d'enregistrement de l'objectif:", err);
    }
  };

  const formatAr = (v: number) => new Intl.NumberFormat('fr-FR').format(v) + ' Ar';

  if (loading) {
    return (
      <Container size="xl" py="100px">
        <Center>
          <Stack align="center">
            <Loader size="md" />
            <Text c="dimmed">Chargement des indicateurs réels...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  // S'assurer de pallier l'absence de données si la BDD renvoie une structure vide
  const kpis = data?.kpis || {
    caMois: 0, soldeMois: 0, voyageursMois: 0, caGlobal: 0, soldeGlobalTotal: 0,
    totalReservationsMois: 0, nouveauxClientsMois: 0, totalDepartsMois: 0,
    tauxRemplissageMoyen: 0, nbClientsTotal: 0, clientsFideles: 0,
    facebookMessages: 0, facebookVentes: 0, tauxTransformation: 0, objectifMois: 25000000
  };

  const topDestinations = data?.topDestinations || [];
  const performanceCharts = data?.performanceCharts || [];
  const publicationsPerformantes = data?.publicationsPerformantes || [];

  const nomMois = [
    { value: '1', label: 'Janvier' }, { value: '2', label: 'Février' }, { value: '3', label: 'Mars' },
    { value: '4', label: 'Avril' }, { value: '5', label: 'Mai' }, { value: '6', label: 'Juin' }
  ].find(m => m.value === moisSelectionne)?.label || 'Juin';

  return (
    <Container size="xl" py="md">
      {/* EN-TÊTE DE LA PAGE */}
      <Group justify="space-between" mb="xl" align="flex-end">
        <div>
          <Title order={2}>Tableau de Bord Intégral</Title>
          <Text c="dimmed" size="sm">Analyse complète de l'agence : Finance, Opérations & Acquisition Facebook</Text>
        </div>
        <Group align="flex-end">
          <Select
            label="Filtrer par mois :"
            data={[{ value: '1', label: 'Janvier' }, { value: '2', label: 'Février' }, { value: '3', label: 'Mars' }, { value: '4', label: 'Avril' }, { value: '5', label: 'Mai' }, { value: '6', label: 'Juin' }]}
            value={moisSelectionne}
            onChange={setMoisSelectionne}
            allowDeselect={false}
            w={160}
          />
          <Badge variant="filled" color="blue" size="lg" h={36}>Période : {nomMois} 2026</Badge>
        </Group>
      </Group>

      {/* BLOC 1 : LES GRANDES CARTES FINANCIÈRES (GLOBALES) */}
      <Title order={4} mb="sm" c="dimmed">Statistiques Financières Globales (Cumulées)</Title>
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card padding="md" radius="md" withBorder shadow="sm" bg="blue.0">
          <Group justify="space-between">
            <Text size="xs" c="blue.9" fw={700} tt="uppercase">Chiffre d'Affaires Total</Text>
            <ThemeIcon color="blue.7" radius="md" size="xl"><IconCurrencyDollar size="1.4rem" /></ThemeIcon>
          </Group>
          <Text size="20px" fw={800} mt="sm" c="blue.9">{formatAr(kpis.caGlobal)}</Text>
          <Text size="xs" c="dimmed" mt={2}>Cumul global sur l'ensemble de l'exercice</Text>
        </Card>

        <Card padding="md" radius="md" withBorder shadow="sm" bg="orange.0">
          <Group justify="space-between">
            <Text size="xs" c="orange.9" fw={700} tt="uppercase">Solde Total à Encaisser</Text>
            <ThemeIcon color="orange.7" radius="md" size="xl"><IconTrendingUp size="1.4rem" /></ThemeIcon>
          </Group>
          <Text size="20px" fw={800} mt="sm" c="orange.9">{formatAr(kpis.soldeGlobalTotal)}</Text>
          <Text size="xs" c="dimmed" mt={2}>Total des restes à payer de tous les clients</Text>
        </Card>

        <Card padding="md" radius="md" withBorder shadow="sm" bg="teal.0">
          <Group justify="space-between">
            <Text size="xs" c="teal.9" fw={700} tt="uppercase">Fidélisation Clients</Text>
            <ThemeIcon color="teal.7" radius="md" size="xl"><IconAward size="1.4rem" /></ThemeIcon>
          </Group>
          <Text size="20px" fw={800} mt="sm" c="teal.9">{kpis.clientsFideles} Clients Fidèles</Text>
          <Text size="xs" c="dimmed" mt={2}>Sur un total unique de {kpis.nbClientsTotal} clients inscrits</Text>
        </Card>
      </SimpleGrid>

      {/* BLOC 2 : VUE RECAPITULATIVE DU MOIS FILTRÉ */}
      <Title order={4} mb="sm" c="dimmed">Performance Mensuelle : {nomMois} 2026</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }} mb="xl">
        {/* CARTE DYNAMIQUE CA DU MOIS AVEC MODIFICATION DE L'OBJECTIF */}
        <Card padding="sm" radius="md" withBorder shadow="xs">

          <Flex justify="space-between" align="center">
            <div>
              <Text size="xs" c="dimmed" fw={700}>CA du Mois</Text>
              <Text size="md" fw={700} mt={5}>{formatAr(kpis.caMois)}</Text>
              <Progress value={kpis.objectifMois > 0 ? (kpis.caMois / kpis.objectifMois) * 100 : 0} color="blue" size="xs" mt="sm" />
            </div>
          </Flex>
          
          <Group justify="space-between" mt="md" align="center" gap={0} style={{ minHeight: '26px' }}>
            {enTrainDEditer ? (
              <Group gap={4} style={{ width: '100%', flexWrap: 'nowrap' }}>
                <NumberInput
                  size="xs"
                  placeholder="Montant Ar"
                  value={nouvelObjectif}
                  onChange={(v) => setNouvelObjectif(Number(v))}
                  thousandSeparator=" "
                  hideControls
                  style={{ flex: 1 }}
                />
                <ActionIcon size="sm" color="green" variant="light" onClick={sauvegarderObjectifManuel}>
                  <IconCheck size="0.9rem" />
                </ActionIcon>
              </Group>
            ) : (
              <>
                <Text size="10px" c="dimmed" fw={500}>
                  Obj : {formatAr(kpis.objectifMois)}
                </Text>
                <ActionIcon 
                  size="xs" 
                  variant="subtle" 
                  color="blue" 
                  onClick={() => {
                    setNouvelObjectif(kpis.objectifMois);
                    setEnTrainDEditer(true);
                  }}
                >
                  <IconEdit size="0.8rem" />
                </ActionIcon>
              </>
            )}
          </Group>
        </Card>

        <Card padding="sm" radius="md" withBorder shadow="xs">
          <Text size="xs" c="dimmed" fw={700}>Voyageurs inscrits</Text>
          <Text size="lg" fw={700} mt={5}>{kpis.voyageursMois}</Text>
          <Text size="10px" c="green.6" fw={500} mt={5}>{kpis.nouveauxClientsMois} nouveaux clients</Text>
        </Card>

        <Card padding="sm" radius="md" withBorder shadow="xs">
          <Text size="xs" c="dimmed" fw={700}>Réservations Générées</Text>
          <Text size="lg" fw={700} mt={5}>{kpis.totalReservationsMois}</Text>
          <Text size="10px" c="dimmed" mt={5}>Dossiers validés ce mois</Text>
        </Card>

        <Card padding="sm" radius="md" withBorder shadow="xs">
          <Text size="xs" c="dimmed" fw={700}>Nombre de Départs</Text>
          <Text size="lg" fw={700} mt={5}>{kpis.totalDepartsMois} départs</Text>
          <Text size="10px" c="dimmed" mt={5}>Plannings ouverts</Text>
        </Card>

        <Card padding="sm" radius="md" withBorder shadow="xs">
          <Text size="xs" c="dimmed" fw={700}>Taux Remplissage Moyen</Text>
          <Text size="lg" fw={700} mt={5} c={kpis.tauxRemplissageMoyen >= 75 ? 'green.7' : 'orange.7'}>
            {kpis.tauxRemplissageMoyen}%
          </Text>
          <Progress value={kpis.tauxRemplissageMoyen} color="orange" size="xs" mt="sm" />
        </Card>
      </SimpleGrid>

      {/* BLOC 3 : DEUX GRANDS PANNEAUX (GRAPHICS ET ACQUISITION) */}
      
      <Grid mb="xl">
        {/* LE TOP DES DESTINATIONS */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card padding="md" radius="md" withBorder shadow="sm" h="100%">
            <Title order={4} mb="md">Top Destinations ({nomMois})</Title>
            {topDestinations.length === 0 ? (
              <Center h={180}><Text c="dimmed" size="sm">Aucune donnée de réservation ce mois-ci</Text></Center>
            ) : (
              <Table striped highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Circuit</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>Nombre de Voyageurs</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Chiffre d'Affaires</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {topDestinations.map((row) => (
                    <Table.Tr key={row.circuit}>
                      <Table.Td fw={500}>{row.circuit}</Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Badge size="sm" variant="light" color="blue">{row.nbClients} voyageurs</Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right', fontWeight: 600 }} c="green.7">
                        {formatAr(row.ca)}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Grid.Col>

        {/* SECTION MARKETING FACEBOOK DYNAMIQUE PAR CIRCUIT */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card padding="md" radius="md" withBorder shadow="sm" h="100%">
            <Group justify="space-between" mb="md">
              <Title order={4}>Performances Facebook Marketing</Title>
            </Group>
            
            <SimpleGrid cols={3} mb="lg">
              <div style={{ textAlign: 'center' }}>
                <Text size="xs" c="dimmed" fw={600}>Messages</Text>
                <Group gap={4} justify="center" mt={3}>
                  <IconMessageCircle size="1rem" color="gray" />
                  <Text size="md" fw={700}>{kpis.facebookMessages}</Text>
                </Group>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text size="xs" c="dimmed" fw={600}>Réservations</Text>
                <Group gap={4} justify="center" mt={3}>
                  <IconCalendar size="1rem" color="gray" />
                  <Text size="md" fw={700}>{kpis.facebookVentes}</Text>
                </Group>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text size="xs" c="dimmed" fw={600}>Conversion</Text>
                <Group gap={4} justify="center" mt={3}>
                  <IconTarget size="1rem" color="gray" />
                  <Text size="md" fw={700} c="blue.7">{kpis.tauxTransformation}%</Text>
                </Group>
              </div>
            </SimpleGrid>

            <Text size="xs" fw={700} c="dimmed" mb={8} tt="uppercase">Performances par Campagne :</Text>
            <Stack gap="xs" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {publicationsPerformantes.length === 0 ? (
                <Text size="xs" c="dimmed" ta="center" py="md">Aucune action marketing enregistrée pour ce mois.</Text>
              ) : (
                publicationsPerformantes.map((pub, idx) => (
                  <Card key={idx} withBorder padding="xs" radius="xs" bg="gray.0">
                    <Text size="xs" fw={600} truncate>{pub.titre}</Text>
                    <Group justify="space-between" mt={4}>
                      <Text size="10px" c="dimmed">Portée: {pub.portee}</Text>
                      <Group gap="xs">
                        <Badge size="xs" color="gray">{pub.messages} msgs</Badge>
                        <Badge size="xs" color="green">{pub.ventes} ventes</Badge>
                      </Group>
                    </Group>
                  </Card>
                ))
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* BLOC 4 : LES GRAPHIQUES D'ÉVOLUTION ANNUELS */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
        <Card padding="md" radius="md" withBorder shadow="sm">
          <Title order={4} mb="lg">Comparatif Revenus Réalisé vs Objectifs Mensuels</Title>
          {/* Conteneur parent avec une hauteur définie */}
          <div style={{ height: 260, width: '100%' }}>
            <BarChart
              h="100%" /* Prend le 100% de la div parent qui fait 260px */
              data={performanceCharts}
              dataKey="month"
              series={[
                { name: 'Realisation', color: 'blue.6', label: 'Réalisé (Ar)' },
                { name: 'Objectif', color: 'gray.4', label: 'Objectif (Ar)' },
              ]}
              gridAxis="xy"
              valueFormatter={(val) => `${new Intl.NumberFormat('fr-FR').format(val)} Ar`}
            />
          </div>
        </Card>

        <Card padding="md" radius="md" withBorder shadow="sm">
          <Title order={4} mb="lg">Évolution du Nombre de Voyageurs par Mois</Title>
          {/* Conteneur parent avec une hauteur définie */}
          <div style={{ height: 260, width: '100%' }}>
            <LineChart
              h="100%" /* Prend le 100% de la div parent qui fait 260px */
              data={performanceCharts}
              dataKey="month"
              series={[{ name: 'Voyageurs', color: 'teal.6', label: 'Voyageurs transportés' }]}
              curveType="monotone"
              gridAxis="xy"
            />
          </div>
        </Card>
      </SimpleGrid>
    </Container>
  );
}