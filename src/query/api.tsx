import axios from "axios";
import { getApiUrl } from "./apiConfig";
import apiRequest from "./apiRequest";
import { checkStatus } from "./apiRequest";

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
