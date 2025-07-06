import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'PDF to Markdown' })).toBeVisible();
  });

  test('should display the description', async ({ page }) => {
    await expect(page.getByText('数学コンテンツに特化したPDF変換ツール')).toBeVisible();
  });

  test('should have feature cards', async ({ page }) => {
    await expect(page.getByText('数式対応')).toBeVisible();
    await expect(page.getByText('表・画像')).toBeVisible();
    await expect(page.getByText('AI変換')).toBeVisible();
    await expect(page.getByText('簡単ダウンロード')).toBeVisible();
  });

  test('should have upload mode toggle', async ({ page }) => {
    await expect(page.getByRole('button', { name: /単一/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /複数/ })).toBeVisible();
  });

  test('should switch between upload modes', async ({ page }) => {
    const singleModeButton = page.getByRole('button', { name: /単一/ });
    const multipleModeButton = page.getByRole('button', { name: /複数/ });

    // Single mode should be active by default
    await expect(singleModeButton).toHaveClass(/bg-background/);

    // Switch to multiple mode
    await multipleModeButton.click();
    await expect(multipleModeButton).toHaveClass(/bg-background/);
    await expect(singleModeButton).not.toHaveClass(/bg-background/);

    // Switch back to single mode
    await singleModeButton.click();
    await expect(singleModeButton).toHaveClass(/bg-background/);
    await expect(multipleModeButton).not.toHaveClass(/bg-background/);
  });

  test('should display usage instructions', async ({ page }) => {
    await expect(page.getByText('使い方')).toBeVisible();
    await expect(page.getByText('PDFアップロード')).toBeVisible();
    await expect(page.getByText('AI変換')).toBeVisible();
    await expect(page.getByText('ダウンロード')).toBeVisible();
  });

  test('should display important notes', async ({ page }) => {
    await expect(page.getByText('注意事項')).toBeVisible();
    await expect(page.getByText('対応ファイル形式: PDF')).toBeVisible();
    await expect(page.getByText('数式はLaTeX形式')).toBeVisible();
  });

  test('should have theme toggle', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /テーマを切り替え/ });
    await expect(themeToggle).toBeVisible();
    
    // Click to open dropdown
    await themeToggle.click();
    
    // Check theme options
    await expect(page.getByText('ライト')).toBeVisible();
    await expect(page.getByText('ダーク')).toBeVisible();
    await expect(page.getByText('システム')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Main heading should still be visible
    await expect(page.getByRole('heading', { name: 'PDF to Markdown' })).toBeVisible();
    
    // Feature cards should stack on mobile
    const featureCards = page.locator('[class*="grid-cols-1"]').first();
    await expect(featureCards).toBeVisible();
  });

  test('should have skip navigation link', async ({ page }) => {
    // Skip link should be hidden by default but focusable
    const skipLink = page.getByRole('link', { name: 'メインコンテンツにスキップ' });
    await expect(skipLink).toBeInTheDOM();
    
    // Focus should make it visible
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check for main landmark
    await expect(page.getByRole('main')).toBeVisible();
    
    // Check for header
    await expect(page.getByRole('banner')).toBeVisible();
    
    // Check for footer
    await expect(page.getByRole('contentinfo')).toBeVisible();
    
    // Check for navigation
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Tab through key interactive elements
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // Theme toggle
    await page.keyboard.press('Tab'); // Single mode button
    await page.keyboard.press('Tab'); // Multiple mode button
    
    // Check that focus is on multiple mode button
    await expect(page.getByRole('button', { name: /複数/ })).toBeFocused();
    
    // Activate with keyboard
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: /複数/ })).toHaveClass(/bg-background/);
  });
});