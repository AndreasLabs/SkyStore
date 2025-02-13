import React, { useCallback, useMemo } from 'react';
import Map, { Marker } from 'react-map-gl';
import { ActionIcon, Box, Group, TextInput, Tooltip } from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const DEFAULT_LOCATION = { latitude: 37.7577, longitude: -122.4376 }; // San Francisco

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

export function LocationPicker({
  value = '',
  onChange,
  error,
  label = 'Location',
  description,
  required,
}: LocationPickerProps) {
  const coordinates = useMemo(() => {
    if (!value) return DEFAULT_LOCATION;
    const [lat, lon] = value.split(',').map(Number);
    return {
      latitude: isNaN(lat) ? DEFAULT_LOCATION.latitude : lat,
      longitude: isNaN(lon) ? DEFAULT_LOCATION.longitude : lon,
    };
  }, [value]);

  const handleMapClick = useCallback(({ lngLat: { lat, lng } }) => {
    onChange(`${lat.toFixed(6)},${lng.toFixed(6)}`);
  }, [onChange]);

  return (
    <Box>
      <TextInput
        label={label}
        description={description}
        error={error}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
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
      <Box mt="sm" style={{ height: 300, borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden' }}>
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            ...coordinates,
            zoom: 11
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/victoryforphil/cm5xshpj600eg01slhyzb1atu"
          onClick={handleMapClick}
        >
          <Marker
            {...coordinates}
            anchor="bottom"
          >
            <IconMapPin size={32} color="var(--mantine-color-blue-filled)" />
          </Marker>
        </Map>
      </Box>
    </Box>
  );
} 