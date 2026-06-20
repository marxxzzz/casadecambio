import { useState, useEffect } from 'react'

export interface Rates {
  USD: number
  EUR: number
  GBP: number
}

export interface RateInfo {
  bid: number
  open: number
  high: number
  low: number
  pct: number
  up: boolean
}

export interface RatesInfo {
  USD: RateInfo
  EUR: RateInfo
  GBP: RateInfo
}

const DEFAULTS: RatesInfo = {
  USD: { bid: 5.1247, open: 5.0616, high: 5.1519, low: 5.0544, pct: 1.562, up: true },
  EUR: { bid: 5.5981, open: 5.6452, high: 5.6498, low: 5.5681, pct: 1.317, up: false },
  GBP: { bid: 6.4832, open: 6.4982, high: 6.5577, low: 6.4979, pct: 0.641, up: true },
}

export function useRates(intervalMs = 30000) {
  const [info, setInfo] = useState<RatesInfo>(DEFAULTS)

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(
          'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL'
        )
        const d = await res.json()
        setInfo({
          USD: {
            bid:  parseFloat(d.USDBRL.bid),
            open: parseFloat(d.USDBRL.open || d.USDBRL.bid),
            high: parseFloat(d.USDBRL.high),
            low:  parseFloat(d.USDBRL.low),
            pct:  Math.abs(parseFloat(d.USDBRL.pctChange)),
            up:   parseFloat(d.USDBRL.pctChange) >= 0,
          },
          EUR: {
            bid:  parseFloat(d.EURBRL.bid),
            open: parseFloat(d.EURBRL.open || d.EURBRL.bid),
            high: parseFloat(d.EURBRL.high),
            low:  parseFloat(d.EURBRL.low),
            pct:  Math.abs(parseFloat(d.EURBRL.pctChange)),
            up:   parseFloat(d.EURBRL.pctChange) >= 0,
          },
          GBP: {
            bid:  parseFloat(d.GBPBRL.bid),
            open: parseFloat(d.GBPBRL.open || d.GBPBRL.bid),
            high: parseFloat(d.GBPBRL.high),
            low:  parseFloat(d.GBPBRL.low),
            pct:  Math.abs(parseFloat(d.GBPBRL.pctChange)),
            up:   parseFloat(d.GBPBRL.pctChange) >= 0,
          },
        })
      } catch {
        // keep previous values
      }
    }
    fetch_()
    const id = setInterval(fetch_, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return info
}
