const fs = require('fs');

const files = {
  'app/api/airtime/checkout/route.js': {
    import: [
      ["import { computeMarkupAmount, hotProductIdForNetwork, generateAirtimeOrderNumber, roundMoney } from '@/lib/airtime'",
       "import { computeMarkupAmount, generateAirtimeOrderNumber, roundMoney } from '@/lib/airtime'\nimport { hotProductId } from '@/lib/currencies'"]
    ],
    body: [
      ["airtimeAmount,",
       "airtimeAmount, currency = 'USD',"]
    ],
    eco: [
      // ecocash charge block
      [/        amount: amountToPay,\n        currency: 'USD',\n        reason: `Shoppy - \$\{network\} Airtime`,\n        sourceReference,\n      }\)\n\n      await prisma.airtimeOrder.update\(\{\n        where: \{ id: airtimeOrder.id \},\n        data: \{\n          paymentMethod: 'ecocash',/g,
       `        amount: amountToPay,\n        currency,\n        reason: \`Shoppy - \${network} Airtime\`,\n        sourceReference,\n      })\n\n      await prisma.airtimeOrder.update({\n        where: { id: airtimeOrder.id },\n        data: {\n          paymentMethod: 'ecocash',`],
      // omari charge block - different context
      [/        amount: amountToPay,\n        currency: 'USD',\n        channel: 'WEB',/g,
       `        amount: amountToPay,\n        currency,\n        channel: 'WEB',`]
    ]
  }
};

// Process airtime file
let c = fs.readFileSync('app/api/airtime/checkout/route.js', 'utf8');

// Imports
c = c.replace(files['app/api/airtime/checkout/route.js'].import[0][0], files['app/api/airtime/checkout/route.js'].import[0][1]);

// Body destructure
c = c.replace(files['app/api/airtime/checkout/route.js'].body[0][0], files['app/api/airtime/checkout/route.js'].body[0][1]);

// Eco blocks
c = c.replace(files['app/api/airtime/checkout/route.js'].eco[0][0], files['app/api/airtime/checkout/route.js'].eco[0][1]);
c = c.replace(files['app/api/airtime/checkout/route.js'].eco[1][0], files['app/api/airtime/checkout/route.js'].eco[1][1]);

fs.writeFileSync('app/api/airtime/checkout/route.js', c);
console.log('Airtime checkout done');
