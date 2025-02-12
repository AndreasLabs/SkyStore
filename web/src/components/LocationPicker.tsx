import React, { useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import Map, { Marker } from 'react-map-gl';
import { ActionIcon, Box, Group, TextInput, Tooltip } from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';
import 'mapbox-gl/dist/mapbox-gl.css';

// Get Mapbox token from environment variables
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

if (!MAPBOX_TOKEN) {
  throw new Error('Missing Mapbox access token. Please add VITE_MAPBOX_ACCESS_TOKEN to your .env file');
}

interface LocationPickerProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  description?: string;
  required?: boolean;
}

interface MapClickEvent {
  lngLat: {
    lat: number;
    lng: number;
  };
}

export function LocationPicker({
  value = '',
  onChange,
  error,
  label = 'Location',
  description,
  required,
}: LocationPickerProps) {
  // Parse location string into coordinates
  const coordinates = useMemo(() => {
    if (!value) return { latitude: 37.7577, longitude: -122.4376 }; // Default to San Francisco
    const [lat, lon] = value.split(',').map(Number);
    return {
      latitude: isNaN(lat) ? 37.7577 : lat,
      longitude: isNaN(lon) ? -122.4376 : lon,
    };
  }, [value]);

  // Handle map click
  const handleMapClick = useCallback((event: MapClickEvent) => {
    const { lat, lng } = event.lngLat;
    onChange(`${lat.toFixed(6)},${lng.toFixed(6)}`);
  }, [onChange]);

  return (
    <Box>
      <Group align="flex-start" grow>
        <TextInput
          label={label}
          description={description}
          error={error}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder="latitude,longitude"
          required={required}
          rightSection={
            <Tooltip label="Click on the map to set coordinates">
              <ActionIcon variant="subtle" size="sm">
                <IconMapPin size={16} />
              </ActionIcon>
            </Tooltip>
          }
        />
      </Group>
      <Box mt="sm" style={{ height: 300, borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden' }}>
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            zoom: 11
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/victoryforphil/cm5xshpj600eg01slhyzb1atu"
          onClick={handleMapClick}
        >
          <Marker
            latitude={coordinates.latitude}
            longitude={coordinates.longitude}
            anchor="bottom"
          >
            <IconMapPin size={32} color="var(--mantine-color-blue-filled)" />
          </Marker>
        </Map>
      </Box>
    </Box>
  );
} 