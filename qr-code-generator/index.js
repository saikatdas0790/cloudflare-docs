const qr = require('qr-image')

async function generate(request) {
  const { text } = await request.json()
  const headers = { 'Content-Type': 'image/png' }
  const qr_png = qr.imageSync(text || 'https://workers.dev')
  return new Response(qr_png, { headers })
}

const landing = `
<h1>QR Generator</h1>
<p>Click the below button to generate a new QR code.</p>
<input type="text" id="text" value="https://saikat.dev"></input>
<button onclick="generate()">Generate QR Code</button>
<p>Check the "Network" tab in your browser's developer tools to see the generated QR code.</p>
<script>
  function generate() {
    fetch(window.location.pathname, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: document.querySelector("#text").value })
    })
  }
</script>
`

/**
 * Fetch and log a request
 * @param {Request} request
 */
function handleRequest(request) {
  if (request.method === 'POST') {
    return generate(request)
  }
  return new Response(landing, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
