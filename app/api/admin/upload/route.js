import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

// Use service role for server-side uploads
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Generate unique filename
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`
    
    // Convert to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false
      })
    
    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('products')
      .getPublicUrl(filename)
    
    return NextResponse.json({ 
      url: urlData.publicUrl,
      path: data.path
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
