interface RequestErrorProps {
  message?: string;
  onRetry: () => void;
}

function RequestError({
  message = "活动数据获取超时，请稍后重试",
  onRetry,
}: RequestErrorProps) {
  return (
    <div className="mx-auto mt-20 flex max-w-md flex-col items-center gap-4 rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
      >
        重新加载
      </button>
    </div>
  );
}

export default RequestError;
