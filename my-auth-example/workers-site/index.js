import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import { authorize, handleRedirect, logout } from "./auth0";

addEventListener("fetch", (event) => {
  event.respondWith(handleEvent(event));
});

async function handleEvent(event) {
  let request = event.request;
  let response = new Response(null);
  const url = new URL(request.url);

  try {
    if (url.pathname === "/auth") {
      const authorizedResponse = await handleRedirect(event);
      if (!authorizedResponse) {
        return new Response("Unauthorized", { status: 401 });
      }
      response = new Response(response.body, {
        response,
        ...authorizedResponse,
      });
      return response;
    }

    const [authorized, { authorization, redirectUrl }] = await authorize(event);

    if (authorized && authorization.accessToken) {
      request = new Request(request, {
        headers: {
          Authorization: `Bearer ${authorization.accessToken}`,
        },
      });
    }

    if (!authorized) {
      return Response.redirect(redirectUrl);
    }

    response = await getAssetFromKV(event);

    // BEGINNING OF LOGOUT CODE BLOCK
    if (url.pathname === "/logout") {
      const { headers } = logout(event);
      return headers
        ? new Response(response.body, {
            ...response,
            headers: Object.assign({}, response.headers, headers),
          })
        : Response.redirect(url.origin);
    }
    // END OF LOGOUT CODE BLOCK

    // BEGINNING OF STATE HYDRATION CODE BLOCK
    return new HTMLRewriter()
      .on("head", hydrateState(authorization.userInfo))
      .transform(response);
    // END OF STATE HYDRATION CODE BLOCK
  } catch (e) {
    return new Response(e.message || e.toString(), { status: 500 });
  }
}

const hydrateState = (state = {}) => ({
  element: (head) => {
    const jsonState = JSON.stringify(state);
    const scriptTag = `<script id="edge_state" type="application/json">${jsonState}</script>`;
    head.append(scriptTag, { html: true });
  },
});
