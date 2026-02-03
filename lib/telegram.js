/**
 * Telegram Bot Notifications
 * Create a bot via @BotFather and get your chat ID via @userinfobot
 */

export async function sendTelegramNotification(message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.warn('Telegram not configured - skipping notification')
    console.log('Would have sent:', message)
    return false
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('Telegram error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to send Telegram notification:', error)
    return false
  }
}

export function formatOrderNotification({ 
  orderId, 
  productName, 
  amount, 
  email, 
  contactMethod, 
  contactValue,
  paymentStatus 
}) {
  return `
🛒 <b>NEW ORDER ${paymentStatus === 'confirmed' ? '✅' : '⏳'}</b>

<b>Order ID:</b> ${orderId}
<b>Product:</b> ${productName}
<b>Amount:</b> $${amount} USD

<b>Customer Contact:</b>
📧 Email: ${email}
${contactMethod !== 'email' ? `${contactMethod === 'telegram' ? '✈️ Telegram' : '💬 WhatsApp'}: ${contactValue}` : ''}

<b>Status:</b> ${paymentStatus === 'confirmed' ? 'Payment Confirmed ✅' : 'Awaiting Payment ⏳'}

${paymentStatus === 'confirmed' ? '👆 Time to deliver!' : 'Will notify when payment confirms.'}
`.trim()
}
