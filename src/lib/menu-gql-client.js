import Cookies from "js-cookie";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const GQL_ENDPOINT = `${BACKEND_URL}/graphql`;

async function gql(query, variables = {}) {
  const headers = { "Content-Type": "application/json" };

  if (typeof window !== "undefined") {
    let token = Cookies.get("auth_token") || localStorage.getItem("auth_token_backup");

    if (!token) {
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.token) {
            token = sessionData.token;
            Cookies.set("auth_token", token, {
              expires: 7,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
            });
            localStorage.setItem("auth_token_backup", token);
          }
        }
      } catch (err) {
        console.error("Failed to auto-restore session:", err);
      }
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(GQL_ENDPOINT, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    const msg = json.errors[0]?.message ?? "GraphQL error";
    throw new Error(msg);
  }
  return json.data;
}

export async function fetchMyMenus() {
  const data = await gql(`
    query GetMyMenus {
      myMenus {
        id
        groupLabel
        groupOrder
        label
        href
        iconName
        itemOrder
        isPublic
        accessType
        isActive
      }
    }
  `);
  return data.myMenus;
}

export async function fetchAdminMenus() {
  const data = await gql(`
    query GetAdminMenus {
      adminMenus {
        menu {
          id
          groupLabel
          groupOrder
          label
          href
          iconName
          itemOrder
          isPublic
          accessType
          isActive
        }
        allowedUserIds
      }
    }
  `);
  return data.adminMenus;
}

export async function mutationCreateMenu(input) {
  const data = await gql(
    `
    mutation CreateMenu($input: CreateMenuInput!) {
      createMenu(input: $input) {
        id
        groupLabel
        label
        href
        iconName
      }
    }
  `,
    { input }
  );
  return data.createMenu;
}

export async function mutationUpdateMenu(id, input) {
  const data = await gql(
    `
    mutation UpdateMenu($id: Int!, $input: UpdateMenuInput!) {
      updateMenu(id: $id, input: $input) {
        id
        groupLabel
        label
        href
        iconName
      }
    }
  `,
    { id: parseInt(id, 10), input }
  );
  return data.updateMenu;
}

export async function mutationDeleteMenu(id) {
  const data = await gql(
    `
    mutation DeleteMenu($id: Int!) {
      deleteMenu(id: $id)
    }
  `,
    { id: parseInt(id, 10) }
  );
  return data.deleteMenu;
}

export async function mutationGrantMenuAccess(menuId, userId) {
  const data = await gql(
    `
    mutation GrantMenuAccess($menuId: Int!, $userId: Int!) {
      grantMenuAccess(menuId: $menuId, userId: $userId)
    }
  `,
    { menuId: parseInt(menuId, 10), userId: parseInt(userId, 10) }
  );
  return data.grantMenuAccess;
}

export async function mutationRevokeMenuAccess(menuId, userId) {
  const data = await gql(
    `
    mutation RevokeMenuAccess($menuId: Int!, $userId: Int!) {
      revokeMenuAccess(menuId: $menuId, userId: $userId)
    }
  `,
    { menuId: parseInt(menuId, 10), userId: parseInt(userId, 10) }
  );
  return data.revokeMenuAccess;
}
