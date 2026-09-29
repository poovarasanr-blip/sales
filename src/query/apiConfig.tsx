import Config from "../assets/json/Config.json";

type ApiConfig = {
  name: string;
  urlEndPoint: string;
  httpMethod: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
};

type ApiPayload = {
  queryProps?: string;
};

export const apiConfig: Record<string, ApiConfig> = {
  updateRoleApi: {
    name: "updateRoleApi",
    urlEndPoint: `${Config?.secureBaseUrlRoute}api/Security/UpdateRoleInSession`,
    httpMethod: "PUT",
  },
  getUserMappedClientList: {
    name: "getUserMappedClientList",
    urlEndPoint: `${Config?.baseUrlRoute}/api/Master/GetUserMappedClientList`,
    httpMethod: "GET",
  },
  getUserMappedClientContractList: {
    name: "getUserMappedClientContractList",
    urlEndPoint: `${Config?.baseUrlRoute}/api/Master/GetUserMappedClientContractList?`,
    httpMethod: "GET",
  },
  createCategory: {
    name: "createCategory",
    urlEndPoint: `${Config?.baseUrlRoute}/api/SaleIncentive/UpsertIncentiveProductCategory`,
    httpMethod: "POST",
  },
  getCategory: {
    name: "getCategory",
    urlEndPoint: `${Config?.baseUrlRoute}/api/SaleIncentive/GetSaleCategory`,
    httpMethod: "GET",
  },
  createSubCategory: {
    name: "createSubCategory",
    urlEndPoint: `${Config?.baseUrlRoute}/api/SaleIncentive/UpsertIncentiveProductSubCategory`,
    httpMethod: "POST",
  },
  productBulkTemplate: {
    name: "productBulkTemplate",
    urlEndPoint: `${Config?.baseUrlTemplateDownload}api/PageLayout/FetchDataset`,
    httpMethod: "POST",
  },
  getExcelTemplate: {
    name: "getExcelTemplate",
    urlEndPoint: `${Config?.baseUrlTemplateDownload}api/PageLayout/GetExcelTemplate`,
    httpMethod: "POST",
  },
  importIncentiveProduct: {
    name: "importIncentiveProduct",
    urlEndPoint: `${Config?.baseUrlRoute}/api/SaleIncentive/ImportIncentiveProduct`,
    httpMethod: "POST",
  },
  importSalesIncentiveTarget: {
    name: "importSalesIncentiveTarget",
    urlEndPoint: `${Config?.baseUrlRoute}/api/SaleIncentive/ImportSalesIncentiveTargetsForEmployees`,
    httpMethod: "POST",
  },
  bulkUpdateActualSales: {
    name: "bulkUpdateActualSales",
    urlEndPoint: `${Config?.baseUrlRoute}/api/SaleIncentive/ImportActualSalesForEmployees`,
    httpMethod: "POST",
  },
  ImportIncentiveRates: {
    name: "ImportIncentiveRates",
    urlEndPoint: `${Config?.baseUrlRoute}/api/SaleIncentive/ImportIncentiveRates`,
    httpMethod: "POST",
  },
  FetchSalesincentiveData: {
    name: "FetchSalesincentiveData",
    urlEndPoint: `${Config?.baseUrlRoute}/api/SaleIncentive/GetSalesIncentiveDataForMonth?`,
    httpMethod: "GET",
  },
  getProductListing: {
    name: "getProductListing",
    urlEndPoint: `${Config?.baseUrlRoute}/api/SaleIncentive/GetIncentiveProductListing`,
    httpMethod: "GET",
  },
  getSalesIncentiveLookupDetails: {
    name: "getSalesIncentiveLookupDetails",
    urlEndPoint: `${Config?.baseUrlRoute}/api/SaleIncentive/GetSalesIncentiveLookupDetails?`,
    httpMethod: "GET",
  },
  UpdateSalesSubmissionRequest: {
    name: "UpdateSalesSubmissionRequest",
    urlEndPoint: `${Config?.baseUrlRoute}/api/SaleIncentive/UpdateSalesSubmissionRequest`,
    httpMethod: "POST",
  },
  FetchDashboardData: {
    name: "FetchDashboardData",
    urlEndPoint: `${Config?.baseUrlRoute}/api/SaleIncentive/GetSalesDashboardDetailsForWebApp`,
    httpMethod: "GET",
  },
  UpsertIncentiveProductCategory: {
    name: "UpsertIncentiveProductCategory",
    urlEndPoint: `${Config?.baseUrlRoute}/api/SaleIncentive/UpsertIncentiveProductCategory`,
    httpMethod: "POST",
  },
  UpsertIncentiveProductMapping: {
    name: "UpsertIncentiveProductMapping",
    urlEndPoint: `${Config?.baseUrlRoute}/api/SaleIncentive/UpsertIncentiveProductMapping`,
    httpMethod: "POST",
  },
  GetIncentiveProductMappingDetails: {
    name: "GetIncentiveProductMappingDetails",
    urlEndPoint: `${Config?.baseUrlRoute}/api/SaleIncentive/GetIncentiveProductMappingDetails?`,
    httpMethod: "GET",
  },
};

export const getApiUrl = (
  payload: ApiPayload | undefined,
  name: keyof typeof apiConfig,
): {
  url: string;
  httpMethod: ApiConfig["httpMethod"];
} => {
  if (payload?.queryProps)
    return {
      url: apiConfig[name].urlEndPoint + payload.queryProps,
      httpMethod: apiConfig[name].httpMethod,
    };
  return {
    url: apiConfig[name].urlEndPoint,
    httpMethod: apiConfig[name].httpMethod,
  };
};
