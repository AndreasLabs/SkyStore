import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useOrganization } from './useOrganizationHooks';
import adze from 'adze';

// Modify the types to include both possible keys
interface OrgRouteParams {
  orgKey?: string;
  org_key?: string;
  organization?: string;
  [key: string]: string | undefined;
}

const CURRENT_ORG_STORAGE_KEY = 'currentOrgKey';
const log = new adze();

// Simple sanitizer for orgKey values
function sanitizeKey(key: string | null | undefined): string {
  if (!key || key === 'undefined') return '';
  return key.trim();
}

export function useCurrentOrganization() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<OrgRouteParams>();

  // Step 1: read from URL if present
  const routeParam = sanitizeKey(params.orgKey || params.org_key || params.organization);

  // Step 2: localStorage fallback if no route param
  const [orgKey, setOrgKey] = useState(() => {
    const localStored = sanitizeKey(localStorage.getItem(CURRENT_ORG_STORAGE_KEY));
    return routeParam || localStored;
  });

  // Step 3: whenever the route param changes, override state
  useEffect(() => {
    // Only update if we're on a route that should have an org key
    const shouldHaveOrgKey = location.pathname.includes('/org/') && 
                            !location.pathname.endsWith('/org') && 
                            !location.pathname.endsWith('/org/') &&
                            !location.pathname.includes('/org/create');

    if (routeParam && routeParam !== orgKey) {
      log.info('Organization key updated from URL', { old: orgKey, new: routeParam });
      setOrgKey(routeParam);
    } else if (!routeParam && orgKey && shouldHaveOrgKey) {
      // Only clear if we're on a route that should have an org key
      log.info('No route param, clearing organization selection to fallback route');
      setOrgKey(''); 
      navigate('/org', { replace: true });
    }
  }, [routeParam, location.pathname]);

  // Step 4: keep localStorage in sync with the selected orgKey
  useEffect(() => {
    if (orgKey) {
      localStorage.setItem(CURRENT_ORG_STORAGE_KEY, orgKey);
    } else {
      localStorage.removeItem(CURRENT_ORG_STORAGE_KEY);
    }
  }, [orgKey]);

  // Step 5: function to *set* or *clear* the organization key
  // passing '' or null will essentially reset it.
  const setOrganization = (newKey: string | null | undefined) => {
    const cleanKey = sanitizeKey(newKey);

    if (cleanKey === orgKey) {
      log.info('Organization already selected; no change', { key: cleanKey });
      return;
    }

    if (!cleanKey) {
      // Clear scenario
      log.info('Clearing organization');
      setOrgKey('');
      navigate('/org');
      return;
    }

    // Setting new organization
    log.info('Switching organization', { old: orgKey, new: cleanKey });
    setOrgKey(cleanKey);
    
    // Don't navigate if we're already on a valid organization route
    const currentPath = location.pathname;
    if (!currentPath.includes(`/org/${cleanKey}`)) {
      navigate(`/org/${cleanKey}`);
    }
  };

  // Step 6: Fetch the organization data using React Query
  const {
    data: organization,
    isLoading,
    error,
    refetch,
  } = useOrganization(orgKey);

  // You can memoize or just return the values directly.
  return useMemo(() => ({
    currentOrgKey: orgKey,
    organization,
    isLoading,
    error,
    refetch,
    setOrganization,
  }), [orgKey, organization, isLoading, error, refetch]);
} 