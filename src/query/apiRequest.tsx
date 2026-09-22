import axios from "axios";

export function checkStatus(response: any) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else if (response?.response?.status === 401) {
    return response.response;
  } else if (
    response.response.status >= 400 &&
    response.response.status < 500
  ) {
    return response.response;
  } else if (
    response.response.status >= 500 &&
    response.response.status < 600
  ) {
    return response.response;
  }
}

export default function apiRequest(url, payload, httpMethod, accessToken) {
  switch (httpMethod) {
    case "GET":
      return axios
        .get(url, {
          headers: {
            // "Access-Control-Allow-Origin": "*",
            // "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
            token: `${accessToken}`,
          },
          transformRequest: [(data: any) => data],
        })
        .then(checkStatus)
        .catch(checkStatus);
    case "POST":
      return axios
        .post(url, payload.data, {
          headers: {
            "Content-Type": "application/json",
            // "Access-Control-Allow-Origin": "*",
            // "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
            token: `${accessToken}`,
          },
          transformRequest: [(data: any) => data],
        })
        .then(checkStatus)
        .catch(checkStatus);
    case "PUT":
      return axios
        .put(url, payload.data, {
          headers: {
            "Content-Type": "application/json",
            // "Access-Control-Allow-Origin": "*",
            // "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
            token: `${accessToken}`,
          },
          transformRequest: [(data: any) => data],
        })
        .then(checkStatus)
        .catch(checkStatus);
    case "DELETE":
      return axios
        .delete(url, {
          headers: {
            // "Access-Control-Allow-Origin": "*",
            // "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
            token: `${accessToken}`,
          },
          transformRequest: [(data: any) => data],
        })
        .then(checkStatus)
        .catch(checkStatus);
    default:
  }
}
