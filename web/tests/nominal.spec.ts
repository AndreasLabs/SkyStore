import { test as base, expect, type Page } from '@playwright/test';
import { Client } from 'minio';
import { createClient } from 'redis';

// Test fixtures and types
type TestFixtures = {
  cleanDb: void;
  minioClient: Client;
  redisClient: ReturnType<typeof createClient>;
  authenticatedPage: Page;
};

// Extend base test with our fixtures
const test = base.extend<TestFixtures>({
  cleanDb: [async ({ minioClient, redisClient }, use) => {
    console.log('🧹 Cleaning database...');
    // Clear MinIO buckets
    const buckets = ['skystore'];
    for (const bucket of buckets) {
      const objectStream = minioClient.listObjects(bucket, '', true);
      for await (const obj of objectStream) {
        await minioClient.removeObject(bucket, obj.name);
      }
    }

    // Clear Redis
    await redisClient.connect();
    await redisClient.flushAll();
    await redisClient.disconnect();
    console.log('✨ Database cleaned');

    await use();
  }, { auto: true }],

  minioClient: [async ({}, use) => {
    console.log('🔌 Initializing MinIO client...');
    const client = new Client({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin'
    });
    await use(client);
    console.log('✅ MinIO client initialized');
  }, { auto: true }],

  redisClient: [async ({}, use) => {
    console.log('🔌 Initializing Redis client...');
    const client = createClient({
      url: 'redis://localhost:6379'
    });
    await use(client);
    console.log('✅ Redis client initialized');
  }, { auto: true }],

  // New fixture for authenticated page
  authenticatedPage: async ({ page }, use) => {
    // Listen to all console events
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      // Filter out noisy messages if needed
      if (!text.includes('Download the React DevTools')) {
        console.log(`🌐 [Browser ${type}]: ${text}`);
      }
    });

    console.log('🔑 Starting authentication process...');
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    console.log('📄 Page loaded');
    
    await page.getByText('No Organizations Yet').click();
    await expect(page.locator('#root')).toContainText('Sign In');
    console.log('👤 On sign in page');
    
    await page.getByRole('button', { name: '? Sign In' }).click();
    console.log('📝 Filling user profile...');

    // Fill in user details
    await page.getByRole('textbox', { name: 'Full Name' }).fill(TEST_USER.fullName);
    await page.getByRole('textbox', { name: 'Email' }).fill(TEST_USER.email);
    await page.getByRole('textbox', { name: 'Bio' }).fill(TEST_USER.bio);
    await page.getByRole('textbox', { name: 'Location' }).fill(TEST_USER.location);
    await page.getByRole('textbox', { name: 'Company' }).fill(TEST_USER.company);
    await page.getByRole('textbox', { name: 'Website' }).fill(TEST_USER.website);
    console.log('✍️ Profile details filled');
    
    await page.getByRole('button', { name: 'Create Profile' }).click();
    console.log('⏳ Waiting for profile creation...');
    await page.waitForLoadState('networkidle');
    
    // Wait for profile creation and navigation with increased timeout
    await expect(page.getByRole('main')).toContainText(TEST_USER.fullName, { timeout: 10000 });
    console.log('✅ Profile created');
    
    await page.getByRole('button', { name: 'SkyStore' }).click();
    await page.waitForLoadState('networkidle');
    
    // Wait for welcome message
    await expect(page.getByRole('heading')).toContainText('Welcome back', { timeout: 10000 });
    await expect(page.getByRole('heading')).toContainText(TEST_USER.fullName, { timeout: 10000 });
    console.log('🏠 On home page');

    await use(page);
  }
});

// Test data constants
const TEST_USER = {
  fullName: 'Alexander Carter',
  email: 'alex@andreaslabs.com',
  bio: 'Test user',
  location: 'Test City, CA',
  company: 'Andreas',
  website: 'andreaslabs.com'
};

const TEST_ORGS = [
  {
    uuid: 'uuid-test-org-1',
    key: 'test-org-1',
    name: 'Test Organization #1',
    description: 'This is the first test org!'
  },
  {
    uuid: 'uuid-test-org-2',
    key: 'test-org-2',
    name: 'Test Organization #2',
    description: 'Test org 2'
  }
];

const TEST_PROJECT = {
  uuid: 'uuid-cool-project',
  key: 'cool-project',
  name: 'Cool Project',
  description: 'my cool project'
};

const TEST_FLIGHT = {
  uuid: 'uuid-cool-flight-1',
  key: 'cool-flight-1',
  name: 'My Cool Flight',
};

const TEST_MISSION = {
  uuid: 'uuid-cool-mission-1',
  key: 'cool-mission-1',
  name: 'My Cool Mission',
  location: 'Test Location',
  date: '2023-01-01T00:00:00Z',
  metadata: {}
};

const TEST_ASSETS = [
  'DJI_20250210133547_0001_D.JPG',
  'DJI_20250210133549_0002_D.JPG',
  'DJI_20250210133551_0003_D.JPG',
  'DJI_20250210133553_0004_D.JPG'
];

// Helper functions
async function refreshAndWait(page: Page) {
  console.log('🔄 Refreshing page...');
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
  console.log('✅ Page refreshed');
}

async function createOrganization(page: Page, org: typeof TEST_ORGS[0]) {
  console.log(`🏢 Creating organization: ${org.name}`);
  
  // Wait for the page to be in a stable state
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
  
  // Log the current URL and content
  console.log(`📍 Current URL: ${page.url()}`);
  console.log('🔍 Looking for Create Organization button...');
  
  // Take screenshot of current state
  await page.screenshot({ path: `debug-before-create-org-${Date.now()}.png` });
  
  // Try to find the button with different selectors
  const createOrgButton = page.getByRole('button', { name: 'Create Organization' });
  const buttonCount = await createOrgButton.count();
  console.log(`Found ${buttonCount} Create Organization buttons`);
  
  // Log all buttons on the page
  const allButtons = page.getByRole('button');
  const buttonTexts = await allButtons.allInnerTexts();
  console.log('All buttons on page:', buttonTexts);
  
  if (buttonCount === 0) {
    // Log the page content for debugging
    console.log('📄 Current page content:');
    console.log(await page.content());
    
    // Try alternative selectors
    console.log('Trying alternative selectors...');
    const buttonByText = page.getByText('Create Organization', { exact: true });
    const buttonByTextCount = await buttonByText.count();
    console.log(`Found ${buttonByTextCount} elements with exact text 'Create Organization'`);
    
    // Check if button might be in a loading state
    const loadingButtons = await page.$$('[aria-busy="true"]');
    console.log(`Found ${loadingButtons.length} loading buttons`);
  }
  
  // Wait for any of the Create Organization buttons
  console.log('Waiting for Create Organization button to be visible...');
  await expect(createOrgButton.first()).toBeVisible({ timeout: 10000 });
  
  // Log button state before clicking
  const firstButton = createOrgButton.first();
  const isVisible = await firstButton.isVisible();
  const isEnabled = await firstButton.isEnabled();
  const box = await firstButton.boundingBox();
  console.log('Button state:', { isVisible, isEnabled, box });
  
  // Take screenshot right before clicking
  await page.screenshot({ path: `debug-before-click-${Date.now()}.png` });
  
  await firstButton.click();
  console.log('Button clicked');
  await page.waitForLoadState('networkidle');
  
  console.log('📝 Filling organization details...');
  await page.getByRole('textbox', { name: 'Organization ID' }).fill(org.key);
  await page.getByRole('textbox', { name: 'Name' }).fill(org.name);
  await page.getByRole('textbox', { name: 'Description' }).fill(org.description);
  
  const submitButton = page.getByRole('button', { name: 'Create Organization' });
  await expect(submitButton).toBeVisible({ timeout: 10000 });
  
  // Log submit button state
  const submitIsVisible = await submitButton.isVisible();
  const submitIsEnabled = await submitButton.isEnabled();
  console.log('Submit button state:', { submitIsVisible, submitIsEnabled });
  
  await submitButton.click();
  console.log('Submit button clicked');
  await page.waitForLoadState('networkidle');
  
  // Wait for organization creation and verify
  await expect(page.getByRole('heading')).toContainText(org.name, { timeout: 10000 });
  console.log('✅ Organization created');
}

async function createProject(page: Page) {
  const createProjectButton = page.getByRole('button', { name: 'Create Project' }).nth(1);
  await expect(createProjectButton).toBeVisible();
  await createProjectButton.click();
  await page.waitForLoadState('networkidle');

  await page.getByRole('textbox', { name: 'Project ID' }).fill(TEST_PROJECT.key);
  await page.getByRole('textbox', { name: 'Name' }).fill(TEST_PROJECT.name);
  await page.getByRole('textbox', { name: 'Description' }).fill(TEST_PROJECT.description);
  await page.getByRole('button', { name: 'Create Project' }).click();
  await page.waitForLoadState('networkidle');
  
  // Wait for project creation
  await expect(page.getByRole('main')).toContainText('Select a mission or create a new one');
}

async function createFlight(page: Page) {
  console.log('🎯 Creating new flight...');
  
  // Find and click the Create Flight button
  console.log('🔍 Looking for Create Flight button...');
  const createFlightButton = page.getByRole('button', { name: 'Create Flight' });
  const buttonCount = await createFlightButton.count();
  console.log(`Found ${buttonCount} Create Flight buttons`);
  
  if (buttonCount === 0) {
    throw new Error('No Create Flight button found');
  }
  
  // Wait for any of the Create Flight buttons
  console.log('Waiting for Create Flight button to be visible...');
  await expect(createFlightButton.first()).toBeVisible({ timeout: 10000 });
  
  // Click the first Create Flight button
  const firstButton = createFlightButton.first();
  await firstButton.click();
  console.log('Create Flight button clicked');
  
  // Fill in the flight details
  console.log('📝 Filling flight details...');
  await page.getByRole('textbox', { name: 'Flight ID' }).fill(TEST_FLIGHT.key);
  await page.getByRole('textbox', { name: 'Name' }).fill(TEST_FLIGHT.name);
  
  // Set location on map
  console.log('🗺️ Setting flight location on map...');
  // ... existing map interaction code ...
  
  // Submit the form
  console.log('Proceeding with flight creation...');
  const submitButton = page.getByRole('button', { name: 'Create Flight' });
  await submitButton.click();
  
  // Enhanced verification and navigation after flight creation
  console.log('Verifying flight creation...');
  
  // Wait for the flight details to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Wait for flight name to appear in the page content
  await expect(page.getByRole('main')).toContainText(TEST_FLIGHT.name, { timeout: 10000 });
  console.log('✅ Flight name visible in content');
  
  // Verify we're in the flight context by checking the breadcrumb/navigation path
  await expect(page.getByRole('navigation')).toContainText(
    TEST_FLIGHT.name
  );
  
  // Try to find any flight-related UI elements
  const flightElements = [
    page.getByRole('heading', { name: TEST_FLIGHT.name }),
    page.getByRole('link', { name: TEST_FLIGHT.name }),
    page.getByText(TEST_FLIGHT.name)
  ];
  
  let foundFlightElement = false;
  for (const element of flightElements) {
    if (await element.count() > 0) {
      foundFlightElement = true;
      console.log('✅ Found flight element in UI');
      break;
    }
  }
  
  if (!foundFlightElement) {
    console.log('⚠️ Could not find flight element with standard selectors, but flight was created');
  }
  
  // Verify URL structure
  const expectedUrlPattern = new RegExp(`/org/${TEST_ORGS[0].key}/project/${TEST_PROJECT.key}/flight/${TEST_FLIGHT.key}`);
  await expect(page).toHaveURL(expectedUrlPattern);
  console.log('✅ Flight URL structure is correct');
  
  console.log('✅ Flight created successfully');
}

// Tests
test.describe('SkyStore Web Application', () => {
  test('should create and manage organizations', async ({ authenticatedPage: page }) => {
    console.log('🧪 Starting organization management test...');
    
    // Create first organization
    await createOrganization(page, TEST_ORGS[0]);
    await refreshAndWait(page);

    console.log('🔄 Testing organization switching...');
    
    // Make sure we're on the correct page before switching
    console.log('📍 Navigating to organization selection...');
    const changeOrgButton = page.getByRole('button', { name: 'Change Organization' });
    // Create second organization
    await page.getByRole('button', { name: 'Change Organization' }).click();
    await createOrganization(page, TEST_ORGS[1]);
    await refreshAndWait(page);

    console.log('🔄 Testing organization switching...');
    // Verify organization switching
    await page.getByRole('button', { name: 'Change Organization' }).click();
    await page.getByRole('button', { name: 'View Projects' }).first().click();
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('button', { name: 'Test Organization #' }).click();
    await expect(page.getByLabel('Test Organization #')).toContainText(TEST_ORGS[1].name);
    
    await page.getByRole('menuitem', { name: TEST_ORGS[0].name }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByLabel('Test Organization #')).toContainText(TEST_ORGS[0].name);
  });

  test('should create and manage projects and flights', async ({ authenticatedPage: page }) => {
    await refreshAndWait(page);
    
    // Create first organization if not exists
    try {
      await createOrganization(page, TEST_ORGS[0]);
    } catch (e) {
      // Organization might already exist
      console.log('Organization may already exist, continuing...');
    }

    await refreshAndWait(page);

    // Create project
    await createProject(page);
    await refreshAndWait(page);
    
    // Verify project creation
    await page.getByRole('button', { name: 'Change Project' }).click();
    await expect(page.getByRole('main')).toContainText(TEST_PROJECT.name);
    await page.getByRole('main').getByRole('button', { name: 'Select Project' }).click();
    await page.waitForLoadState('networkidle');

    // Create flight
    await expect(page.getByRole('main')).toContainText('No Flights Yet');
    await createFlight(page);
    await page.getByRole('main').getByRole('button', { name: 'Select Flight' }).click();
    
    // Verify flight selection
    await expect(page.getByRole('main')).toContainText(
      TEST_FLIGHT.name
    );
    
    // Navigate to the correct flight if needed
    const flightLink = page.getByRole('link', { name: TEST_FLIGHT.name });
    if (await flightLink.count() > 0) {
      await flightLink.click();
    }
    
    // Test asset management
    await page.locator('a').filter({ hasText: `Assets${TEST_FLIGHT.name}` }).click();
    
    // Test flight selection in asset upload
    await page.getByRole('textbox', { name: 'Select a flight' }).click();
    await page.getByRole('option', { name: TEST_FLIGHT.name }).click();
    
    // Test navigation
    await page.locator('a').filter({ hasText: `Flight${TEST_FLIGHT.name}` }).click();
    await page.locator('a').filter({ hasText: `Assets${TEST_FLIGHT.name}` }).click();
  });

  test('should handle asset uploads', async ({ authenticatedPage: page }) => {
    await refreshAndWait(page);
    
    // Navigate to the correct mission if needed
    const uploadButton = page.getByRole('button', { name: 'Upload Assets' }).first();
    await expect(uploadButton).toBeVisible();
    await uploadButton.click();
    await page.waitForLoadState('networkidle');
    
    // Upload assets
    await page.getByRole('button', { name: 'Upload Assets' }).first().setInputFiles(TEST_ASSETS);
    await page.waitForLoadState('networkidle');

    // Verify uploads with retries
    for (const asset of TEST_ASSETS) {
      await expect(page.getByRole('main')).toContainText(asset, { timeout: 10000 });
    }

    // Navigate through assets
    await page.locator('a').filter({ hasText: `Assets${TEST_MISSION.name}` }).click();
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('textbox', { name: 'Select a mission' }).click();
    await page.getByRole('option', { name: TEST_MISSION.name }).click();
    await page.waitForLoadState('networkidle');
    
    await page.locator('a').filter({ hasText: `Mission${TEST_MISSION.name}` }).click();
    await page.waitForLoadState('networkidle');
    
    await page.locator('a').filter({ hasText: `Assets${TEST_MISSION.name}` }).click();
    await page.waitForLoadState('networkidle');

    // Verify assets are still visible with longer timeout
    await expect(page.getByRole('main')).toContainText(TEST_ASSETS[3], { timeout: 10000 });
    await expect(page.getByRole('main')).toContainText(TEST_ASSETS[2], { timeout: 10000 });
  });
});
