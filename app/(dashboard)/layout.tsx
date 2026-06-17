'use client';

import { useState, useEffect } from 'react';
import { 
  AppShell, 
  Burger, 
  Group, 
  NavLink, 
  Text, 
  ScrollArea, 
  Avatar, 
  Menu, 
  UnstyledButton, 
  Divider, 
  rem,
  Skeleton
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconDashboard, 
  IconCalendarUser, 
  IconBus, 
  IconBrandFacebook, 
  IconLogout, 
  IconRoute, 
  IconUsers, 
  IconUserPlus, 
  IconSettings, 
  IconChevronRight,
  IconLuggage 
} from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure();
  const router = useRouter();
  const pathname = usePathname();

  // États pour stocker les informations de l'utilisateur connecté
  const [userNom, setUserNom] = useState<string>('Chargement...');
  const [userRole, setUserRole] = useState<string>(''); 
  const [loading, setLoading] = useState<boolean>(true);


  // Charger les informations réelles du profil au montage du Layout
  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        const storedUserId = localStorage.getItem('userId');

        if (!storedUserId) {
          router.push('/');
          return;
        }

        const res = await fetch('/api/profil', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': storedUserId
          }
        });

        if (res.ok) {
          const data = await res.json();
          setUserNom(data.nom || 'Utilisateur');
          setUserRole(data.role || 'Agent');
        } else {
          console.error("Session invalide");
          router.push('/');
        }
      } catch (err) {
        console.error("Impossible de charger les droits utilisateur", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSession();
  }, [router]);


  const navigateTo = (path: string) => {
    router.push(path);
    close(); 
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    router.push('/');
    close();
  };

  const getNavLinkStyles = (isActive: boolean) => ({
    root: {
      backgroundColor: isActive ? 'var(--mantine-color-blue-light)' : 'transparent',
      color: isActive ? 'var(--mantine-color-blue-shade)' : 'var(--mantine-color-gray-7)',
      fontWeight: isActive ? 600 : 500,
      borderRadius: 'var(--mantine-radius-md)',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: isActive 
          ? 'var(--mantine-color-blue-light)' 
          : 'var(--mantine-color-gray-1)',
        transform: 'translateX(4px)',
      },
    },
    label: { fontSize: rem(14) },
  });

  return (
    <AppShell
      header={{ height: 65 }}
      navbar={{ 
        width: 280, 
        breakpoint: 'sm', 
        collapsed: { mobile: !opened } 
      }}
      padding={{ base: 'md', sm: 'xl' }}
      styles={{
        main: {
          background: 'linear-gradient(180deg, var(--mantine-color-gray-0) 0%, #f1f3f5 100%)',
        }
      }}
    >
      {/* HEADER */}
      <AppShell.Header 
        px="md" 
        style={{ 
          borderBottom: '1px solid var(--mantine-color-gray-2)',
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Group gap="xs">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          
          <Group gap={6} style={{ cursor: 'pointer' }} onClick={() => navigateTo('/main')}>
            <div 
              style={{ 
                background: 'linear-gradient(135deg, var(--mantine-color-blue-6), var(--mantine-color-cyan-5))',
                borderRadius: 'var(--mantine-radius-md)',
                width: rem(36),
                height: rem(36),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(34, 139, 230, 0.25)'
              }}
            >
              <IconLuggage size="1.4rem" color="white" stroke={1.8} />
            </div>
            
            <Text
              component="h3"
              hiddenFrom="sm"
              gradient={{ from: 'blue.7', to: 'cyan.6', deg: 45 }}
              variant="gradient"
              style={{
                letterSpacing: '-1px',
                fontWeight: 800,
                fontSize: 'calc(1.375rem * var(--mantine-scale))',
                margin: 0
              }}
            >
              Dia Travel
            </Text>
          </Group>
        </Group>

        {/* Menu Profil Rapide Dynamique */}
        <Menu shadow="md" width={200} position="bottom-end" transitionProps={{ transition: 'pop-top-right' }}>
          <Menu.Target>
            <UnstyledButton style={{ padding: '4px 8px', borderRadius: 'var(--mantine-radius-sm)' }}>
              <Group gap="xs">
                <Avatar radius="xl" color="blue" variant="filled" size="sm">
                  {loading ? '..' : userNom.substring(0, 2).toUpperCase()}
                </Avatar>
                <div style={{ flex: 1 }} className="hidden-mobile">
                  {loading ? (
                    <>
                      <Skeleton height={12} width={60} mb={4} />
                      <Skeleton height={8} width={80} />
                    </>
                  ) : (
                    <>
                      <Text size="sm" fw={600} style={{ lineHeight: 1 }}>{userNom}</Text>
                      <Text size="xs" c="dimmed">{userRole}</Text>
                    </>
                  )}
                </div>
                <IconChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
              </Group>
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Mon Compte</Menu.Label>
            <Menu.Item 
              leftSection={<IconSettings size={14} />} 
              onClick={() => navigateTo('/profil')}
            >
              Modifier mon profil
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item 
              color="red" 
              leftSection={<IconLogout size={14} />} 
              onClick={() => handleLogout()}
            >
              Déconnexion
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </AppShell.Header>

      {/* NAVBAR AVEC CONTRÔLE DES RÔLES */}
      <AppShell.Navbar p="md" style={{ borderRight: '1px solid var(--mantine-color-gray-2)' }}>
        <AppShell.Section grow component={ScrollArea} mx="-md" px="md">
          
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs" mt="xs" px="xs" style={{ letterSpacing: '0.5px' }}>
            Tableau de Bord
          </Text>
          <NavLink
            label="Vue d'ensemble"
            leftSection={<IconDashboard size="1.3rem" stroke={1.5} />}
            active={pathname === '/main'}
            onClick={() => navigateTo('/main')}
            styles={getNavLinkStyles(pathname === '/main')}
            mb={4}
          />

          <Divider my="md" label="Opérations" labelPosition="center" />

          <NavLink
            label="Marketing Facebook"
            leftSection={<IconBrandFacebook size="1.3rem" stroke={1.5} />}
            active={pathname === '/marketing'}
            onClick={() => navigateTo('/marketing')}
            styles={getNavLinkStyles(pathname === '/marketing')}
            mb={4}
          />
          
          <NavLink
            label="Suivi des départs"
            leftSection={<IconBus size="1.3rem" stroke={1.5} />}
            active={pathname === '/departs'}
            onClick={() => navigateTo('/departs')}
            styles={getNavLinkStyles(pathname === '/departs')}
            mb={4}
          />

          <NavLink
            label="Réservations"
            leftSection={<IconCalendarUser size="1.3rem" stroke={1.5} />}
            active={pathname === '/reservations'}
            onClick={() => navigateTo('/reservations')}
            styles={getNavLinkStyles(pathname === '/reservations')}
            mb={4}
          />

          <NavLink
            label="Liste des Clients"
            leftSection={<IconUsers size="1.3rem" stroke={1.5} />}
            active={pathname === '/clients'}
            onClick={() => navigateTo('/clients')}
            styles={getNavLinkStyles(pathname === '/clients')}
            mb={4}
          />

          <Divider my="md" label="Configuration" labelPosition="center" />

          <NavLink
            label="Circuits"
            leftSection={<IconRoute size="1.3rem" stroke={1.5} />}
            active={pathname === '/circuits'}
            onClick={() => navigateTo('/circuits')}
            styles={getNavLinkStyles(pathname === '/circuits')}
            mb={4}
          />
         
          {/* APPLICATION DU RÔLE : Masqué si l'utilisateur n'est pas Administrateur */}
          {!loading && userRole === 'Administrateur' && (
            <NavLink
              label="Utilisateurs & Comptes"
              leftSection={<IconUserPlus size="1.3rem" stroke={1.5} />}
              active={pathname === '/utilisateurs'}
              onClick={() => navigateTo('/utilisateurs')}
              styles={getNavLinkStyles(pathname === '/utilisateurs')}
              mb={4}
            />
          )}

          <NavLink
            label="Mon Profil"
            leftSection={<IconSettings size="1.3rem" stroke={1.5} />}
            active={pathname === '/profil'}
            onClick={() => navigateTo('/profil')}
            styles={getNavLinkStyles(pathname === '/profil')}
            mb={4}
          />
        </AppShell.Section>

        <AppShell.Section style={{ paddingTop: 'var(--mantine-spacing-md)' }}>
          <NavLink
            label="Déconnexion"
            leftSection={<IconLogout size="1.3rem" stroke={1.5} />}
            color="red"
            variant="light"
            onClick={() => handleLogout()}
            styles={{
              root: {
                borderRadius: 'var(--mantine-radius-md)',
                fontWeight: 600
              }
            }}
          />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}