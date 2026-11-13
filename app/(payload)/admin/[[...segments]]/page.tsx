/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from 'next'
import { connection } from 'next/server'

import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

// Mahira edit (item 1c, DECISIONS §2.10): wait for the request before
// RootPage, so Payload's anonymous redirect to /admin/login is never sent as
// prefetchable runtime data that the browser keeps as the /admin page.
// Re-apply when Payload regenerates this file (DEC-006 upgrade review).
const Page = async ({ params, searchParams }: Args) => {
  await connection()
  return RootPage({ config, params, searchParams, importMap })
}

export default Page
