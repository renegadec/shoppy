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
  
  // Ensure payment method defaults
  const paymentDefaults = [
    { key: 'ecocash', enabled: true, note: null, sortOrder: 1 },
    { key: 'crypto', enabled: true, note: null, sortOrder: 2 },
    { key: 'card', enabled: false, note: 'Coming soon', sortOrder: 3 },
  ]

  for (const m of paymentDefaults) {
    await prisma.paymentMethodSetting.upsert({
      where: { key: m.key },
      create: m,
      update: {},
    })
  }
  console.log('✅ Payment method settings ensured')

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
