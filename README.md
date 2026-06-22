# aiPod 432Hz

Reproductor musical estilo Spotify con biblioteca por generos, letras, portadas, resonancia global a 432 Hz y checkout PayPal por cancion.

## Vercel

El proyecto puede desplegarse directo en Vercel desde este repositorio. No requiere build: `index.html` se sirve como sitio estatico y la carpeta `api/paypal` se publica como Vercel Functions.

Variables de entorno necesarias en Vercel:

```env
PAYPAL_ENV=sandbox
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_CURRENCY=USD
SONG_PRICE_USD=1.77
```

Para produccion cambia `PAYPAL_ENV=live` y usa credenciales Live de PayPal. El precio de cada cancion se fija del lado servidor con `SONG_PRICE_USD=1.77`.

## PayPal

El navegador carga el PayPal JavaScript SDK con el `PAYPAL_CLIENT_ID`. La creacion y captura de ordenes se hacen en servidor con:

- `POST /api/paypal/create-order`
- `POST /api/paypal/capture-order`
- `GET /api/paypal/config`

Nunca publiques `PAYPAL_CLIENT_SECRET` en el frontend.
