import { 
  Container, 
  Title, 
  Text, 
  Button, 
  Group, 
  Stack,
  Card,
  SimpleGrid,
  Center,
  Loader,
  BackgroundImage,
  Overlay,
  Box,
  ThemeIcon,
  rem,
  Paper,
  Transition,
  Avatar,
  Badge,
  Grid,
  Divider,
  ActionIcon,
  Image
} from '@mantine/core';
import { createStyles } from '@mantine/styles';
import { 
  IconBuildingSkyscraper, 
  IconUser, 
  IconPlus,
  IconRocket,
  IconPhoto,
  IconChartBar,
  IconMap,
  IconCloud,
  IconDatabase,
  IconExternalLink,
  IconArrowRight,
  IconStar,
  IconChevronRight,
  IconBrandTwitter,
  IconBrandGithub,
  IconMountain,
  IconMapSearch,
  IconDeviceLaptop,
  IconCloudUpload,
  IconUsers,
  IconChevronDown,
  IconMapPins,
  IconDrone,
  IconUserCheck,
  IconShieldCheck
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import cx from 'clsx';

// Custom styles
const useStyles = createStyles((theme) => ({
  glassCard: {
    backgroundColor: 'rgba(0, 24, 57, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 15px 30px rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    }
  },

  neonButton: {
    background: 'rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 0 20px rgba(0, 149, 255, 0.2)',
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',

    '&:hover': {
      boxShadow: '0 0 30px rgba(0, 149, 255, 0.6)',
      border: '1px solid rgba(0, 149, 255, 0.6)',
      transform: 'translateY(-3px) scale(1.02)',
    },
  },

  neonText: {
    textShadow: '0 0 15px rgba(0, 149, 255, 0.6)',
  },

  heroSection: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: theme.colors.dark[9],
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at center, rgba(0,118,255,0.15) 0%, rgba(0,0,0,0) 70%)',
      animation: 'pulse 10s ease-in-out infinite',
      zIndex: 0,
    },
    '@keyframes pulse': {
      '0%': { opacity: 0.6 },
      '50%': { opacity: 1 },
      '100%': { opacity: 0.6 }
    }
  },

  featureIcon: {
    background: 'linear-gradient(135deg, #0070f3 0%, #00c3ff 100%)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'rotate(5deg) scale(1.1)',
    }
  },

  gradientBorder: {
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: theme.radius.md,
      padding: '1px',
      background: 'linear-gradient(45deg, rgba(0, 118, 255, 0.5), rgba(59, 178, 242, 0.5))',
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      maskComposite: 'exclude',
      pointerEvents: 'none',
    }
  },
  
  ctaSection: {
    backgroundImage: 'linear-gradient(45deg, rgba(0, 24, 69, 0.9) 0%, rgba(0, 78, 146, 0.9) 100%), url(https://images.unsplash.com/photo-1506947411487-a56738267384?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  
  statsCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'transform 0.3s ease',
    '&:hover': {
      transform: 'scale(1.05)',
    }
  },
  
  testimonialCard: {
    background: 'rgba(0, 24, 57, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 15px 30px rgba(0, 0, 0, 0.3)',
    }
  },
  
  starIcon: {
    color: '#FFD700',
  },
  
  footerSection: {
    backgroundColor: theme.colors.dark[9],
    borderTop: `1px solid ${theme.colors.dark[6]}`,
  }
}));

const features = [
  {
    icon: IconDrone,
    title: 'Mission Planning',
    description: 'Plan drone flights efficiently with our intuitive tools. Set waypoints, configure altitude, and optimize flight paths for maximum coverage and data quality.'
  },
  {
    icon: IconMapPins,
    title: 'Geospatial Analysis',
    description: 'Process and analyze georeferenced imagery with our powerful toolset. Generate orthomosaics, digital surface models, and point clouds from your UAV data.'
  },
  {
    icon: IconCloudUpload,
    title: 'Secure Cloud Storage',
    description: 'Store and organize all your UAV mission data in our secure cloud platform. Access your orthophotos, point clouds, and models from anywhere.'
  },
  {
    icon: IconUsers,
    title: 'Team Collaboration',
    description: 'Share data and insights with your team members securely. Control access permissions and collaborate on projects in real-time.'
  },
  {
    icon: IconDeviceLaptop,
    title: 'Data Processing',
    description: 'Process raw drone imagery into actionable data products. Generate 3D models, terrain analysis, and vegetation indices automatically.'
  },
  {
    icon: IconShieldCheck,
    title: 'Compliance Management',
    description: 'Stay compliant with aviation regulations by documenting flight logs, maintenance records, and pilot certifications in one system.'
  }
];

const testimonials = [
  {
    quote: "SkyStore has transformed how we manage UAV data across multiple construction sites. The ability to quickly process and share orthophotos has cut our reporting time in half.",
    name: "Alex Johnson",
    role: "Project Manager, BuildTech Engineering",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
  },
  {
    quote: "For our environmental monitoring projects, SkyStore provides the perfect platform to organize years of drone survey data and track changes over time with high precision.",
    name: "Mei Zhang",
    role: "Environmental Scientist, EcoSurvey Inc.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
  }
];

const stats = [
  { value: '2,500+', label: 'Flight Missions' },
  { value: '50 TB', label: 'Data Stored' },
  { value: '85%', label: 'Faster Analysis' },
  { value: '350+', label: 'Organizations' }
];

export function Home() {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const [animationTriggered, setAnimationTriggered] = useState(false);
  
  useEffect(() => {
    // Trigger animations after component mounts
    setAnimationTriggered(true);
  }, []);
  
  // Welcome page
  return (
    <Box>
      {/* Hero Section */}
      <Box pos="relative" h={rem(600)} className={classes.heroSection}>
        <BackgroundImage
          src="https://images.unsplash.com/photo-1579829366248-204fe8413f31?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80"
          h="100%"
        >
          <Overlay
            gradient="linear-gradient(180deg, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, .95) 50%)"
            opacity={0.8}
            zIndex={0}
          />
          <Container size="lg" h="100%">
            <Center h="100%">
              <Transition mounted={animationTriggered} transition="slide-up" duration={800} timingFunction="ease">
                {(styles) => (
                  <Stack align="center" gap="xl" style={{ ...styles, zIndex: 1 }}>
                    <Title order={1} size={rem(54)} c="white" ta="center">
                      Welcome to SkyStore
                    </Title>
                    <Text c="gray.2" size={rem(22)} maw={700} ta="center" lh={1.6}>
                      Your complete platform for managing UAV missions, 
                      processing data, and collaborating with your team
                    </Text>
                    <Group mt={rem(20)}>
                      <Button
                        size="lg"
                        className={classes.neonButton}
                        onClick={() => navigate('/profile')}
                        leftSection={<IconUser size={20} />}
                        radius="md"
                        px={rem(40)}
                      >
                        Get Started
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        color="gray"
                        onClick={() => navigate('/missions')}
                        rightSection={<IconArrowRight size={18} />}
                      >
                        Explore Missions
                      </Button>
                    </Group>
                  </Stack>
                )}
              </Transition>
            </Center>
          </Container>
        </BackgroundImage>
      </Box>

      {/* Stats Section */}
      <Container size="lg" mt={-rem(60)} mb={rem(80)} style={{ position: 'relative', zIndex: 10 }}>
        <Transition mounted={animationTriggered} transition="slide-up" duration={1000} timingFunction="ease">
          {(styles) => (
            <Paper 
              p="xl" 
              radius="lg" 
              shadow="xl" 
              style={{ 
                ...styles,
                background: 'linear-gradient(135deg, rgba(0, 24, 57, 0.9) 0%, rgba(0, 46, 95, 0.9) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing={30}>
                {stats.map((stat) => (
                  <Card key={stat.label} p="md" radius="md" className={classes.statsCard}>
                    <Stack align="center">
                      <Text fw={700} size={rem(32)} c="blue.4">
                        {stat.value}
                      </Text>
                      <Text size="sm" c="gray.5" mt={rem(5)}>
                        {stat.label}
                      </Text>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            </Paper>
          )}
        </Transition>
      </Container>

      {/* Features Section */}
      <Container size="lg" py={rem(60)}>
        <Transition mounted={animationTriggered} transition="fade" duration={1000} timingFunction="ease">
          {(styles) => (
            <Stack gap={60} style={styles}>
              <Stack gap="md" align="center">
                <Badge size="lg" radius="sm" color="blue" variant="filled">POWERFUL FEATURES</Badge>
                <Title order={2} size={rem(36)} ta="center">
                  Everything You Need for UAV Data Management
                </Title>
                <Text c="dimmed" ta="center" maw={700} mx="auto" size="lg">
                  SkyStore provides all the tools you need to manage your drone missions,
                  process data, and collaborate with your team seamlessly
                </Text>
              </Stack>

              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={30}>
                {features.map((feature, index) => (
                  <Transition 
                    key={feature.title} 
                    mounted={animationTriggered} 
                    transition="slide-up" 
                    duration={500} 
                    timingFunction="ease"
                  >
                    {(styles) => (
                      <Paper 
                        className={cx(classes.glassCard, classes.gradientBorder)}
                        p="xl" 
                        radius="md"
                        style={styles}
                      >
                        <Stack gap="md">
                          <ThemeIcon
                            size={60}
                            radius="md"
                            className={cx(classes.featureIcon, "featureIcon")}
                          >
                            <feature.icon size={rem(30)} stroke={1.5} />
                          </ThemeIcon>
                          <Stack gap="xs">
                            <Text size={rem(22)} fw={600}>
                              {feature.title}
                            </Text>
                            <Text size="md" c="dimmed" lh={1.6}>
                              {feature.description}
                            </Text>
                          </Stack>
                          <Button 
                            variant="subtle" 
                            color="blue" 
                            rightSection={<IconChevronRight size={16} />} 
                            radius="xl" 
                          >
                            Learn more
                          </Button>
                        </Stack>
                      </Paper>
                    )}
                  </Transition>
                ))}
              </SimpleGrid>
            </Stack>
          )}
        </Transition>
      </Container>
      
      {/* Testimonials Section */}
      <Box py={rem(80)} style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,24,69,0.2) 100%)' }}>
        <Container size="lg">
          <Transition mounted={animationTriggered} transition="fade" duration={800} timingFunction="ease">
            {(styles) => (
              <Stack gap={40} style={styles}>
                <Stack gap="xs" align="center">
                  <Badge size="lg" radius="sm" color="cyan" variant="filled">TESTIMONIALS</Badge>
                  <Title order={2} size={rem(36)} ta="center">
                    What Our Users Say
                  </Title>
                </Stack>
                
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing={30}>
                  {testimonials.map((testimonial, index) => (
                    <Transition 
                      key={testimonial.name} 
                      mounted={animationTriggered} 
                      transition="slide-up" 
                      duration={500} 
                      timingFunction="ease"
                    >
                      {(styles) => (
                        <Paper 
                          className={classes.testimonialCard} 
                          p="xl" 
                          radius="md"
                          style={styles}
                        >
                          <Stack gap="md">
                            <Group gap="xs">
                              {[...Array(5)].map((_, i) => (
                                <IconStar key={i} size={16} style={{ color: '#FFD700' }} />
                              ))}
                            </Group>
                            <Text size="lg" c="gray.3" lh={1.6}>
                              "{testimonial.quote}"
                            </Text>
                            <Group>
                              <Avatar src={testimonial.avatar} size="lg" radius="xl" />
                              <Stack gap={0}>
                                <Text fw={600} size="md" c="white">
                                  {testimonial.name}
                                </Text>
                                <Text size="sm" c="dimmed">
                                  {testimonial.role}
                                </Text>
                              </Stack>
                            </Group>
                          </Stack>
                        </Paper>
                      )}
                    </Transition>
                  ))}
                </SimpleGrid>
              </Stack>
            )}
          </Transition>
        </Container>
      </Box>
      
      {/* CTA Section */}
      <Container size="lg" py={rem(80)}>
        <Transition mounted={animationTriggered} transition="fade" duration={800} timingFunction="ease">
          {(styles) => (
            <Box className={classes.ctaSection} p={rem(50)} style={styles}>
              <Grid gutter={40}>
                <Grid.Col span={{ base: 12, md: 7 }}>
                  <Stack gap="md">
                    <Title order={2} size={rem(36)} c="white">
                      Ready to Streamline Your Drone Operations?
                    </Title>
                    <Text size="lg" c="gray.3" maw={600} lh={1.6}>
                      Join hundreds of surveying companies, construction firms, and environmental agencies who are already using SkyStore to manage their UAV data.
                    </Text>
                    <Group mt="md">
                      <Button 
                        size="lg" 
                        className={classes.neonButton}
                        leftSection={<IconDrone size={20} />}
                        onClick={() => navigate('/register')}
                      >
                        Create Your Account
                      </Button>
                      <Button 
                        size="lg" 
                        variant="outline" 
                        color="gray"
                        onClick={() => navigate('/missions')}
                      >
                        View Sample Missions
                      </Button>
                    </Group>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 5 }}>
                  <Image
                    src="https://images.unsplash.com/photo-1527977966376-1c8408f9f108?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                    radius="md"
                    style={{ 
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                    }}
                  />
                </Grid.Col>
              </Grid>
            </Box>
          )}
        </Transition>
      </Container>
      
      {/* Footer Section */}
      <Box className={classes.footerSection} py={rem(40)}>
        <Container size="lg">
          <Stack gap="xl">
            <Grid>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Stack gap="md">
                  <Title order={3} size={rem(24)}>
                    SkyStore
                  </Title>
                  <Text size="sm" c="dimmed" maw={300}>
                    Your complete platform for managing UAV missions, processing data, and collaborating with your team.
                  </Text>
                  <Group>
                    <ActionIcon variant="subtle" color="blue" size="lg">
                      <IconBrandTwitter size={22} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="blue" size="lg">
                      <IconBrandGithub size={22} />
                    </ActionIcon>
                  </Group>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 6, md: 2 }}>
                <Stack gap="sm">
                  <Text fw={600} mb={5}>Product</Text>
                  <Text size="sm" c="dimmed">Features</Text>
                  <Text size="sm" c="dimmed">Pricing</Text>
                  <Text size="sm" c="dimmed">Documentation</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 6, md: 2 }}>
                <Stack gap="sm">
                  <Text fw={600} mb={5}>Company</Text>
                  <Text size="sm" c="dimmed">About Us</Text>
                  <Text size="sm" c="dimmed">Careers</Text>
                  <Text size="sm" c="dimmed">Contact</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 6, md: 2 }}>
                <Stack gap="sm">
                  <Text fw={600} mb={5}>Resources</Text>
                  <Text size="sm" c="dimmed">Blog</Text>
                  <Text size="sm" c="dimmed">Community</Text>
                  <Text size="sm" c="dimmed">Support</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 6, md: 2 }}>
                <Stack gap="sm">
                  <Text fw={600} mb={5}>Legal</Text>
                  <Text size="sm" c="dimmed">Privacy</Text>
                  <Text size="sm" c="dimmed">Terms</Text>
                  <Text size="sm" c="dimmed">Security</Text>
                </Stack>
              </Grid.Col>
            </Grid>
            
            <Divider color="gray.8" />
            
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                © 2023 SkyStore. All rights reserved.
              </Text>
              <Text size="sm" c="dimmed">
                Made for the UAV community
              </Text>
            </Group>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
} 