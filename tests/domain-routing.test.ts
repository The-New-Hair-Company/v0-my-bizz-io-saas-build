import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isApplicationApi,
  isApplicationHost,
  isApplicationPage,
  isMarketingHost,
  isMarketingPage,
  safeApplicationRedirect,
} from '../lib/deployment.ts'

test('production hosts have one unambiguous experience', () => {
  assert.equal(isMarketingHost('mybizz.io'), true)
  assert.equal(isMarketingHost('www.mybizz.io'), true)
  assert.equal(isMarketingHost('app.mybizz.io'), false)
  assert.equal(isApplicationHost('app.mybizz.io'), true)
  assert.equal(isApplicationHost('www.mybizz.io'), false)
})

test('application and marketing pages are classified without overlap', () => {
  assert.equal(isApplicationPage('/dashboard/accounts'), true)
  assert.equal(isApplicationPage('/crm/newsletters'), true)
  assert.equal(isApplicationPage('/auth/login'), true)
  assert.equal(isApplicationPage('/billing/subscribe'), true)
  assert.equal(isMarketingPage('/pricing'), true)
  assert.equal(isMarketingPage('/start'), true)
  assert.equal(isMarketingPage('/dashboard'), false)
})

test('privileged application APIs cannot be served from the marketing host', () => {
  assert.equal(isApplicationApi('/api/portal/records'), true)
  assert.equal(isApplicationApi('/api/newsletters/schedule'), true)
  assert.equal(isApplicationApi('/api/billing/webhook'), true)
  assert.equal(isApplicationApi('/api/intake'), false)
  assert.equal(isApplicationApi('/api/public-assistant'), false)
  assert.equal(isApplicationApi('/api/email-events/webhook'), false)
})

test('post-auth redirects cannot leave the application origin', () => {
  assert.equal(safeApplicationRedirect('/dashboard/accounts'), 'https://app.mybizz.io/dashboard/accounts')
  assert.equal(safeApplicationRedirect('https://evil.example/phish'), 'https://app.mybizz.io/dashboard')
  assert.equal(safeApplicationRedirect('//evil.example/phish'), 'https://app.mybizz.io/dashboard')
})
