export const createErrorResponse = (message: string) => {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: message,
      },
    ],
  };
};

export const createSuccessResponse = (response: object) => {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(response),
      },
    ],
  };
};
