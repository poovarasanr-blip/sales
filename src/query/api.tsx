import axios from "axios";
import { getApiUrl } from "./apiConfig";
import apiRequest from "./apiRequest";
import { checkStatus } from "./apiRequest";
import encrypt from "../utils/security/encrypt";
import decrypt from "../utils/security/decrypt";
import { parseNestedJson } from "../utils/security/ParseData";

export interface MappedClient {
  Id: number;
  ClientName: string;
}

export interface MappedClientContract {
  Id: number;
  Name: string;
  ClientId: number;
}

function parseMasterList<T>(
  response: unknown,
  sessionKey: string,
  vector: string,
): T[] {
  const responseRecord =
    response && typeof response === "object"
      ? (response as Record<string, unknown>)
      : {};
  const status = responseRecord.status;
  if (typeof status !== "number" || status < 200 || status >= 300) {
    throw new Error("Failed to load master list.");
  }

  let payload: unknown = responseRecord.data;
  if (typeof payload === "string") {
    const decrypted = decrypt(payload, sessionKey, vector);
    try {
      payload = JSON.parse(decrypted || payload);
    } catch {
      throw new Error("Invalid master list response.");
    }
  }

  const parsed = parseNestedJson(payload);
  const parsedRecord =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  const list: unknown = Array.isArray(parsed)
    ? parsed
    : (parsedRecord?.dynamicObject ??
      parsedRecord?.Result ??
      parsedRecord?.Data ??
      parsedRecord?.data ??
      parsedRecord?.result);

  if (!Array.isArray(list)) {
    throw new Error("Invalid master list response.");
  }
  return list as T[];
}

export async function handleGetUserMappedClientList(
  key: string,
  vector: string,
  token: string,
): Promise<MappedClient[]> {
  const { url, httpMethod } = getApiUrl(undefined, "getUserMappedClientList");
  const response = await apiRequest(url, null, httpMethod, token);
  return parseMasterList<MappedClient>(response, key, vector);
}

export async function handleGetUserMappedClientContractList(
  clientId: number,
  key: string,
  vector: string,
  token: string,
): Promise<MappedClientContract[]> {
  const encryptedClientId = encrypt(
    JSON.stringify(clientId),
    key,
    vector,
  ).replace(/=/gi, "%3D");
  const { url, httpMethod } = getApiUrl(
    { queryProps: `clientId=${encryptedClientId}` },
    "getUserMappedClientContractList",
  );
  const response = await apiRequest(url, null, httpMethod, token);
  return parseMasterList<MappedClientContract>(response, key, vector);
}

export const handleUpdateRole = async (payload: string, token: string) => {
  const { url, httpMethod } = getApiUrl(undefined, "updateRoleApi");
  return await apiRequest(url, payload, httpMethod, token);
};

export const handleCreatecategory = async (payload: string, token: string) => {
  const { url, httpMethod } = getApiUrl(undefined, "createCategory");
  return await apiRequest(url, { data: payload }, httpMethod, token);
};
export const handleGetcategory = async (payload: string, token: string) => {
  const { url, httpMethod } = getApiUrl(undefined, "getCategory");
  return await apiRequest(url, null, httpMethod, token);
};
export const handleCreateSubcategory = async (
  payload: string,
  token: string,
) => {
  const { url, httpMethod } = getApiUrl(undefined, "createSubCategory");
  return await apiRequest(url, { data: { data: payload } }, httpMethod, token);
};
export const handleGetProductBulkTemplate = async (
  payload: string,
  token: string,
) => {
  const { url } = getApiUrl(undefined, "productBulkTemplate");
  return axios
    .post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
        token: `${token}`,
      },
      transformRequest: [(data: any) => data],
    })
    .then(checkStatus)
    .catch(checkStatus);
};

export const handleGetExcelTemplate = async (
  payload: string,
  token: string,
) => {
  const { url } = getApiUrl(undefined, "getExcelTemplate");
  return axios
    .post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
        token: `${token}`,
      },
      transformRequest: [(data: any) => data],
    })
    .then(checkStatus)
    .catch(checkStatus);
};

export const handleImportIncentiveProduct = async (
  payload: string,
  token: string,
) => {
  const { url, httpMethod } = getApiUrl(undefined, "importIncentiveProduct");
  return await apiRequest(url, { data: payload }, httpMethod, token);
};

export const handleImportIncentiveRates = async (
  payload: string,
  token: string,
) => {
  const { url, httpMethod } = getApiUrl(undefined, "ImportIncentiveRates");
  return await apiRequest(url, { data: payload }, httpMethod, token);
};

export const handleImportSalesIncentiveTarget = async (
  payload: string,
  token: string,
) => {
  const { url, httpMethod } = getApiUrl(
    undefined,
    "importSalesIncentiveTarget",
  );
  return await apiRequest(url, { data: payload }, httpMethod, token);
};

export const handleBulkUpdateActualSales = async (
  payload: string,
  token: string,
) => {
  const { url, httpMethod } = getApiUrl(undefined, "bulkUpdateActualSales");
  return await apiRequest(url, { data: payload }, httpMethod, token);
};

export const handleFetchSalesIncentiveData = async (
  payload: any,
  token: string,
) => {
  const { url, httpMethod } = getApiUrl(payload, "FetchSalesincentiveData");
  return await apiRequest(url, null, httpMethod, token);
};

export const handleGetProductListing = async (payload: any, token: string) => {
  const { url, httpMethod } = getApiUrl(payload, "getProductListing");
  return await apiRequest(url, null, httpMethod, token);
};

export const handleUpdateSalesIncentiveAdjustment = async (
  payload: string,
  token: string,
) => {
  const { url, httpMethod } = getApiUrl(
    undefined,
    "UpdateSalesSubmissionRequest",
  );
  return await apiRequest(url, { data: payload }, httpMethod, token);
};

export const handleGetDashboard = async (payload: any, token: string) => {
  const { url, httpMethod } = getApiUrl(payload, "FetchDashboardData");
  return await apiRequest(url, null, httpMethod, token);
};
