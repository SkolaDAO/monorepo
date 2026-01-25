import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, formatEther } from "viem";
import { useContractConfig } from "./useContracts";

export type Course = {
  creator: `0x${string}`;
  priceUsd: bigint;
  metadataURI: string;
  active: boolean;
  totalSales: bigint;
  totalRevenue: bigint;
};

export function useCourse(courseId: bigint) {
  const { courseMarketplace } = useContractConfig();

  const { data, isLoading, refetch } = useReadContract({
    ...courseMarketplace,
    functionName: "getCourse",
    args: [courseId],
    query: { staleTime: 30_000 },
  });

  const { data: priceInEth } = useReadContract({
    ...courseMarketplace,
    functionName: "getPriceInETH",
    args: [courseId],
    query: { staleTime: 30_000 },
  });

  return {
    course: data as Course | undefined,
    priceUsd: data ? formatUnits(data.priceUsd, 6) : "0",
    priceEth: priceInEth ? formatEther(priceInEth) : "0",
    priceEthRaw: priceInEth ?? 0n,
    isLoading,
    refetch,
  };
}

export function useHasAccess(courseId: bigint, user: `0x${string}` | undefined) {
  const { courseMarketplace } = useContractConfig();

  const { data, isLoading, refetch } = useReadContract({
    ...courseMarketplace,
    functionName: "hasAccess",
    args: user ? [courseId, user] : undefined,
    query: { enabled: !!user, staleTime: 30_000 },
  });

  return {
    hasAccess: data ?? false,
    isLoading,
    refetch,
  };
}

export function useNextCourseId() {
  const { courseMarketplace } = useContractConfig();

  const { data } = useReadContract({
    ...courseMarketplace,
    functionName: "nextCourseId",
    query: { staleTime: 60_000 },
  });

  return data ?? 1n;
}

export function useCreateCourse() {
  const { courseMarketplace } = useContractConfig();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const nextCourseId = useNextCourseId();

  const createCourse = (priceUsd: bigint, metadataURI: string) => {
    writeContract({
      ...courseMarketplace,
      functionName: "createCourse",
      args: [priceUsd, metadataURI],
    });
  };

  return { createCourse, hash, isPending, isConfirming, isSuccess, error, courseId: nextCourseId };
}

export function usePurchaseWithETH() {
  const { courseMarketplace } = useContractConfig();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const purchase = (
    courseId: bigint,
    value: bigint,
    referrer: `0x${string}` = "0x0000000000000000000000000000000000000000"
  ) => {
    writeContract({
      ...courseMarketplace,
      functionName: "purchaseWithETH",
      args: [courseId, referrer],
      value,
    });
  };

  return { purchase, hash, isPending, isConfirming, isSuccess, error };
}

export function usePurchaseWithUSDC() {
  const { courseMarketplace } = useContractConfig();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const purchase = (
    courseId: bigint,
    referrer: `0x${string}` = "0x0000000000000000000000000000000000000000"
  ) => {
    writeContract({
      ...courseMarketplace,
      functionName: "purchaseWithUSDC",
      args: [courseId, referrer],
    });
  };

  return { purchase, hash, isPending, isConfirming, isSuccess, error };
}

export type CreatorCourse = {
  id: bigint;
  creator: `0x${string}`;
  priceUsd: string;
  metadataURI: string;
  active: boolean;
  totalSales: number;
  totalRevenue: string;
  metadata: {
    title: string;
    description: string;
    category: string;
    imageUrl: string;
  } | null;
};

function parseMetadata(metadataURI: string) {
  try {
    if (metadataURI.startsWith("data:application/json;base64,")) {
      const base64 = metadataURI.replace("data:application/json;base64,", "");
      return JSON.parse(atob(base64));
    }
    return null;
  } catch {
    return null;
  }
}

export function useCreatorCourses(creator: `0x${string}` | undefined) {
  const { courseMarketplace } = useContractConfig();
  const nextCourseId = useNextCourseId();

  const courseIds: bigint[] = [];
  for (let i = 1n; i < nextCourseId; i++) {
    courseIds.push(i);
  }

  const contracts = courseIds.map((id) => ({
    ...courseMarketplace,
    functionName: "getCourse" as const,
    args: [id] as const,
  }));

  const { data: results, isLoading } = useReadContracts({
    contracts,
    query: { 
      enabled: !!creator && courseIds.length > 0,
      staleTime: 30_000,
    },
  });

  const courses: CreatorCourse[] = [];
  results?.forEach((result, index) => {
    if (result.status === "success" && result.result) {
      const course = result.result as Course;
      if (creator && course.creator.toLowerCase() === creator.toLowerCase()) {
        courses.push({
          id: courseIds[index],
          creator: course.creator,
          priceUsd: formatUnits(course.priceUsd, 6),
          metadataURI: course.metadataURI,
          active: course.active,
          totalSales: Number(course.totalSales),
          totalRevenue: formatUnits(course.totalRevenue, 6),
          metadata: parseMetadata(course.metadataURI),
        });
      }
    }
  });

  return { courses, isLoading };
}
