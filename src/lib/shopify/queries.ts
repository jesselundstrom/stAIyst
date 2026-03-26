export const PRODUCT_SEARCH_QUERY = /* GraphQL */ `
  query ProductSearch($query: String!, $first: Int!) {
    products(query: $query, first: $first) {
      edges {
        node {
          id
          title
          vendor
          handle
          availableForSale
          productType
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          onlineStoreUrl
        }
      }
    }
  }
`;

export interface ShopifyProductNode {
  id: string;
  title: string;
  vendor: string;
  handle: string;
  availableForSale: boolean;
  productType: string;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: {
    edges: Array<{ node: { url: string; altText: string | null } }>;
  };
  onlineStoreUrl: string | null;
}

export interface ShopifySearchResponse {
  products: {
    edges: Array<{ node: ShopifyProductNode }>;
  };
}
