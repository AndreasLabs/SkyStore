import { useState, useEffect } from 'react';
import { 
  Title, 
  Text, 
  Stack, 
  TextInput, 
  Button, 
  Divider, 
  Paper, 
  Select,
  NativeSelect,
  Group,
  Container
} from '@mantine/core';

export function Settings() {
  const [mapboxToken, setMapboxToken] = useState(localStorage.getItem('mapbox_token') || '');
  const [styleUrl, setStyleUrl] = useState(localStorage.getItem('mapbox_style') || 'mapbox://styles/mapbox/satellite-v9');
  const [customStyleInput, setCustomStyleInput] = useState('');
  const [mapStyles, setMapStyles] = useState([
    { value: 'mapbox://styles/mapbox/satellite-v9', label: 'Satellite' },
    { value: 'mapbox://styles/mapbox/outdoors-v12', label: 'Outdoors' },
    { value: 'mapbox://styles/mapbox/streets-v12', label: 'Streets' },
    { value: 'mapbox://styles/mapbox/navigation-day-v1', label: 'Navigation Day' },
    { value: 'mapbox://styles/mapbox/navigation-night-v1', label: 'Navigation Night' },
    { value: 'mapbox://styles/mapbox/light-v10', label: 'Light' },
    { value: 'mapbox://styles/mapbox/dark-v10', label: 'Dark' },
    { value: 'mapbox://styles/mapbox/light-v9', label: 'Light v9' },
    { value: 'mapbox://styles/mapbox/dark-v9', label: 'Dark v9' },
    { value: 'mapbox://styles/mapbox/light-v8', label: 'Light v8' },
    { value: 'mapbox://styles/victoryforphil/cm5xshpj600eg01slhyzb1atu', label: 'Dark VFP' },
  ]);
  
  const handleSaveSettings = () => {
    localStorage.setItem('mapbox_token', mapboxToken);
    localStorage.setItem('mapbox_style', styleUrl);
    localStorage.setItem('custom_map_styles', JSON.stringify(
      mapStyles.filter(style => !style.value.startsWith('mapbox://styles/mapbox/'))
    ));
    alert('Settings saved successfully!');
  };
  
  // Add a custom style URL
  const addCustomStyle = () => {
    if (!customStyleInput) return;
    
    const newOption = { 
      value: customStyleInput, 
      label: `Custom: ${customStyleInput.split('/').pop() || customStyleInput}` 
    };
    
    setMapStyles(prev => {
      // Check if already exists
      if (prev.some(style => style.value === customStyleInput)) {
        return prev;
      }
      return [...prev, newOption];
    });
    
    setStyleUrl(customStyleInput);
    setCustomStyleInput('');
  };
  
  // Load custom styles on component mount
  useEffect(() => {
    const savedCustomStyles = localStorage.getItem('custom_map_styles');
    if (savedCustomStyles) {
      try {
        const customStyles = JSON.parse(savedCustomStyles);
        setMapStyles(prev => {
          const existingValues = new Set(prev.map(item => item.value));
          const newStyles = customStyles.filter(style => !existingValues.has(style.value));
          return [...prev, ...newStyles];
        });
      } catch (e) {
        console.error('Failed to parse custom map styles', e);
      }
    }
  }, []);

  return (
    <Container size="md" py="xl">
      <Stack spacing="lg">
        <Title order={2}>Settings</Title>
        
        <Paper withBorder p="md">
          <Stack>
            <Title order={4}>Mapbox Configuration</Title>
            <Text size="sm" c="dimmed">
              Configure your Mapbox token and style URL for the 3D map editor.
            </Text>
            
            <Divider my="sm" />
            
            <TextInput
              label="Mapbox Access Token"
              description="Your token is stored in local storage and never sent to our servers."
              placeholder="Enter your Mapbox access token"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.currentTarget.value)}
            />
            
            <Select
              label="Map Style"
              description="Select a predefined style"
              placeholder="Select map style"
              data={mapStyles}
              value={styleUrl}
              onChange={(value) => value && setStyleUrl(value)}
              searchable
              clearable
            />
            
            <Stack spacing="xs">
              <Text size="sm" fw={500}>Add Custom Style URL</Text>
              <Group align="flex-end">
                <TextInput
                  placeholder="Enter custom Mapbox style URL"
                  style={{ flex: 1 }}
                  value={customStyleInput}
                  onChange={(e) => setCustomStyleInput(e.currentTarget.value)}
                />
                <Button onClick={addCustomStyle} disabled={!customStyleInput}>
                  Add
                </Button>
              </Group>
              <Text size="xs" c="dimmed">
                Tip: Add your own Mapbox style URL to use custom map styles
              </Text>
            </Stack>
            
            <Button onClick={handleSaveSettings} mt="md">
              Save Settings
            </Button>
          </Stack>
        </Paper>
        
        <Paper withBorder p="md">
          <Stack>
            <Title order={4}>Application Preferences</Title>
            <Text size="sm" c="dimmed">
              Configure general application settings.
            </Text>
            
            <Divider my="sm" />
            
            <Select
              label="Default Units"
              placeholder="Select default units"
              data={[
                { value: 'metric', label: 'Metric (meters)' },
                { value: 'imperial', label: 'Imperial (feet)' },
              ]}
              defaultValue="metric"
            />
            
            <TextInput
              label="Default Flight Name Prefix"
              placeholder="Flight"
              defaultValue="Flight"
            />
            
            <Button onClick={() => alert('Preferences saved!')} mt="md">
              Save Preferences
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
} 