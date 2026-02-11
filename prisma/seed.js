const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// Existing products from JSON
const existingProducts = [
  {
    id: "google-ai-combo",
    name: "Google AI Combo",
    shortDescription: "2TB Storage + Gemini Advanced + Nano Banana Pro",
    highlights: [
      {
        title: "Google One – 2TB Storage",
        description: "Massive space across Gmail, Drive, and Photos — everything in one place!"
      },
      {
        title: "Gemini Advanced AI (Veo 3.1 Ready)",
        description: "Writing, coding, research, data analysis — plus auto video & image creation powered by AI"
      },
      {
        title: "Google Nano Banana Pro",
        description: "Generate stunning images in one click, just the way you imagine"
      }
    ],
    tagline: "The ultimate Google productivity bundle!",
    price: 45,
    period: "year",
    image: "/images/google-ai-combo.png",
    features: [
      "2TB Cloud Storage",
      "Gemini Advanced AI",
      "Veo 3.1 Video Generation",
      "Nano Banana Pro Images",
      "Priority Support"
    ],
    popular: true
  },
  {
    id: "grammarly-pro",
    name: "Grammarly Pro",
    shortDescription: "Premium writing assistant - Shared Account",
    highlights: [
      {
        title: "Advanced Grammar & Spelling",
        description: "Catch errors that basic checkers miss"
      },
      {
        title: "Tone Detection",
        description: "Make sure your message lands the way you intend"
      },
      {
        title: "Plagiarism Checker",
        description: "Ensure your content is original"
      },
      {
        title: "Word Choice & Clarity",
        description: "Write with impact and precision"
      }
    ],
    tagline: "Elevate your writing with Grammarly Pro! Shared account access — full Pro features at a fraction of the cost.",
    price: 52,
    period: "year",
    image: "/images/grammarly-pro.png",
    features: [
      "Advanced Grammar Check",
      "Tone Detection",
      "Plagiarism Checker",
      "Style Improvements",
      "Browser Extension"
    ],
    popular: false
  },
  {
    id: "lovable-pro",
    name: "Lovable Pro",
    shortDescription: "AI-powered app builder",
    highlights: [
      {
        title: "AI App Generation",
        description: "Describe what you want, Lovable builds it"
      },
      {
        title: "Full-Stack Apps",
        description: "Frontend, backend, database — all handled"
      },
      {
        title: "Deploy Instantly",
        description: "Go live with one click"
      },
      {
        title: "Iterate Fast",
        description: "Change anything with natural language"
      }
    ],
    tagline: "Build apps with AI — no coding required! 3 months of Pro access to supercharge your building.",
    price: 40,
    period: "3 months",
    image: "/images/lovable-pro.png",
    features: [
      "AI App Generation",
      "Full-Stack Deployment",
      "Unlimited Iterations",
      "Custom Domains",
      "Priority Generation"
    ],
    popular: false
  },

  // Additional real products (examples — adjust pricing/period as needed)
  {
    id: "canva-pro",
    name: "Canva Pro",
    shortDescription: "Design like a pro — premium templates, brand kit, and exports",
    highlights: [
      { title: "Premium assets", description: "Millions of photos, videos, and graphics" },
      { title: "Brand kit", description: "Logos, fonts, and colors in one place" },
      { title: "Background remover", description: "One‑click clean cutouts" },
      { title: "Pro exports", description: "Resize, transparent PNGs, and more" }
    ],
    tagline: "Create stunning designs faster with Canva Pro.",
    price: 35,
    period: "year",
    image: "/images/canva-pro.png",
    features: ["Premium templates", "Brand kit", "Magic resize", "Background remover"],
    popular: true
  },
  {
    id: "chatgpt-plus",
    name: "ChatGPT Plus",
    shortDescription: "Faster responses + access during peak times",
    highlights: [
      { title: "Faster", description: "Priority speed and reliability" },
      { title: "Best for work", description: "Writing, planning, coding assistance" },
      { title: "Always available", description: "Better access during peak hours" }
    ],
    tagline: "Upgrade your productivity with ChatGPT Plus.",
    price: 25,
    period: "month",
    image: "/images/chatgpt-plus.png",
    features: ["Priority access", "Faster responses", "Great for work"],
    popular: false
  },
  {
    id: "notion-plus",
    name: "Notion Plus",
    shortDescription: "Workspaces, collaboration, and powerful database notes",
    highlights: [
      { title: "Organize everything", description: "Docs, tasks, and databases" },
      { title: "Collaboration", description: "Share pages and work as a team" },
      { title: "Better limits", description: "More uploads and more power" }
    ],
    tagline: "Turn your notes into a system with Notion Plus.",
    price: 15,
    period: "month",
    image: "/images/notion-plus.png",
    features: ["Team collaboration", "Databases", "Better upload limits"],
    popular: false
  },

  // $1 test product for real end-to-end payment tests
  {
    id: "test-product-1usd",
    name: "Test Product (Sandbox) — $1",
    shortDescription: "Internal testing product for checkout + payment + webhook.",
    highlights: [
      { title: "Testing only", description: "Do not purchase unless instructed" },
      { title: "Fast verification", description: "Used to validate payments and webhooks" }
    ],
    tagline: "This product exists to test the checkout flow.",
    price: 1,
    period: "one-time",
    image: "/images/test-product.png",
    features: ["Test checkout", "Test NOWPayments", "Test webhook"],
    popular: false
  }
]

async function main() {
  console.log('🌱 Starting seed...')
  
  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@shoppy.co.zw'
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123'
  
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail }
  })
  
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    await prisma.admin.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin'
      }
    })
    console.log(`✅ Created admin user: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)
    console.log('   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!')
  } else {
    console.log('✅ Admin user already exists')
  }
  
  // Migrate products
  for (const product of existingProducts) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name }
    })
    
    if (!existing) {
      await prisma.product.create({
        data: {
          name: product.name,
          shortDescription: product.shortDescription,
          highlights: product.highlights,
          tagline: product.tagline,
          price: product.price,
          period: product.period,
          image: product.image,
          features: product.features,
          popular: product.popular,
          active: true
        }
      })
      console.log(`✅ Created product: ${product.name}`)
    } else {
      console.log(`⏭️  Product already exists: ${product.name}`)
    }
  }
  
  console.log('🎉 Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
