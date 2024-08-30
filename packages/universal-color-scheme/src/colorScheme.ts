// react-native-web doesn't implement Appearance.setColorScheme
// and doesn't support Appearance being different from the prefers-color-scheme
// but its common to want to have a way to force override the scheme
// this implements a setColorScheme and getColorScheme that can override system

import { useLayoutEffect, useState } from 'react'
import { Appearance } from 'react-native'

export type ColorSchemeName = 'light' | 'dark'
export type ColorSchemeSetting = ColorSchemeName | 'system'
export type ColorSchemeListener = (current: ColorSchemeName) => void

export function setColorScheme(next: ColorSchemeSetting) {
  isOverriden = next !== 'system'
  update(next === 'system' ? getSystemColorScheme() : next)
}

export function getColorScheme(): ColorSchemeName {
  return colorScheme
}

export function onColorSchemeChange(listener: ColorSchemeListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useColorScheme() {
  const [state, setState] = useState(getColorScheme())

  useLayoutEffect(() => {
    return onColorSchemeChange(setState)
  }, [])

  return [state, setColorScheme] as const
}

export function useColorSchemeSetting() {
  const [state, setState] = useState(getColorSchemeSetting())

  useLayoutEffect(() => {
    return onColorSchemeChange(() => setState(getColorSchemeSetting()))
  }, [])

  return [state, setColorScheme] as const
}

// internals

const getColorSchemeSetting = (): ColorSchemeSetting => {
  if (isOverriden) {
    return colorScheme
  }
  return 'system'
}

const getWebIsDarkMatcher = () =>
  typeof window !== 'undefined' ? window.matchMedia?.('(prefers-color-scheme: dark)') : null

function getSystemColorScheme() {
  if (process.env.TAMAGUI_TARGET === 'native') {
    return Appearance.getColorScheme() || 'light'
  }
  return getWebIsDarkMatcher()?.matches ? 'dark' : 'light'
}

let isOverriden = false
let colorScheme: ColorSchemeName = getSystemColorScheme()

const listeners = new Set<ColorSchemeListener>()

function update(next: ColorSchemeName) {
  if (next === colorScheme) return
  colorScheme = next
  if (process.env.TAMAGUI_TARGET === 'native') {
    Appearance.setColorScheme(next)
  }
  listeners.forEach((l) => l(colorScheme))
}

if (process.env.TAMAGUI_TARGET === 'native') {
  Appearance.addChangeListener((next) => {
    if (isOverriden) return
    if (next.colorScheme) {
      update(next.colorScheme)
    }
  })
} else {
  getWebIsDarkMatcher()?.addEventListener('change', (val) => {
    if (isOverriden) return
    update(getSystemColorScheme())
  })
}