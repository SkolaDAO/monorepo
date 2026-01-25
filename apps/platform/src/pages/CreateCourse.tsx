import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { parseUnits } from "viem";
import { Button, Card, CardContent, CardHeader, CardTitle, Container, toast } from "@skola/ui";
import { useCreatorInfo } from "../hooks/useCreatorRegistry";
import { useCreateCourse } from "../hooks/useCourseMarketplace";
import { useCreateCourse as useCreateCourseApi } from "../hooks/useApiCourses";
import { useCategories } from "../hooks/useCategories";
import { useAuth } from "../contexts/AuthContext";
import { ImageUpload } from "../components/ImageUpload";
import { ConnectButton } from "@rainbow-me/rainbowkit";

type Step = 1 | 2;

type CourseFormData = {
  title: string;
  description: string;
  price: string;
  isFree: boolean;
  category: string;
  imageUrl: string;
};

export function CreateCoursePage() {
  const { isConnected, address } = useAccount();
  const { isRegistered } = useCreatorInfo(address);
  const { isAuthenticated, signIn, isLoading: authLoading } = useAuth();

  if (!isConnected) {
    return <NotConnectedState />;
  }

  if (!isRegistered) {
    return <NotStakedState />;
  }

  if (!isAuthenticated) {
    return <NotSignedInState onSignIn={signIn} isLoading={authLoading} />;
  }

  return <CourseWizard />;
}

function CourseWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<CourseFormData>({
    title: "",
    description: "",
    price: "",
    isFree: false,
    category: "",
    imageUrl: "",
  });
  const [errors, setErrors] = useState<Partial<CourseFormData>>({});

  const { categories } = useCategories();
  const { createCourse: createCourseOnChain, isPending, isConfirming, isSuccess, error, courseId: onChainCourseId } = useCreateCourse();
  const { createCourse: createCourseInDb, isLoading: isCreatingInDb } = useCreateCourseApi();

  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: categories[0].slug }));
    }
  }, [categories, formData.category]);
  const [pendingFormData, setPendingFormData] = useState<CourseFormData | null>(null);

  useEffect(() => {
    if (isConfirming) {
      toast.loading("Creating course on-chain...", { id: "create-course" });
    }
  }, [isConfirming]);

  useEffect(() => {
    if (isSuccess && pendingFormData && onChainCourseId) {
      createCourseInDb({
        title: pendingFormData.title,
        description: pendingFormData.description,
        thumbnail: pendingFormData.imageUrl || undefined,
        priceUsd: pendingFormData.price || "0",
        onChainId: Number(onChainCourseId),
      })
        .then((course) => {
          queryClient.invalidateQueries({ queryKey: ["readContract"] });
          queryClient.invalidateQueries({ queryKey: ["readContracts"] });
          toast.success("Course created! Now add your content.", { id: "create-course" });
          navigate(`/course/${course.id}/edit`);
        })
        .catch(() => {
          toast.error("Course created on-chain but failed to sync. Please contact support.", { id: "create-course" });
          navigate("/dashboard");
        });
      setPendingFormData(null);
    }
  }, [isSuccess, pendingFormData, onChainCourseId, createCourseInDb, queryClient, navigate]);

  useEffect(() => {
    if (error) {
      toast.error("Failed to create course. Please try again.", { id: "create-course" });
      setPendingFormData(null);
    }
  }, [error]);

  const validateStep1 = (): boolean => {
    const newErrors: Partial<CourseFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    if (!formData.isFree) {
      if (!formData.price) {
        newErrors.price = "Price is required for paid courses";
      } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
        newErrors.price = "Price must be a positive number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    if (formData.isFree) {
      toast.loading("Creating course...", { id: "create-course" });
      try {
        const course = await createCourseInDb({
          title: formData.title,
          description: formData.description,
          thumbnail: formData.imageUrl || undefined,
          priceUsd: "0",
        });
        toast.success("Course created! Now add your content.", { id: "create-course" });
        navigate(`/course/${course.id}/edit`);
      } catch {
        toast.error("Failed to create course. Please try again.", { id: "create-course" });
      }
    } else {
      const USDC_DECIMALS = 6;
      const priceUsd = parseUnits(formData.price, USDC_DECIMALS);

      const metadata = JSON.stringify({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        imageUrl: formData.imageUrl || "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop",
        isFree: formData.isFree,
        createdAt: Date.now(),
      });

      const metadataURI = `data:application/json;base64,${btoa(metadata)}`;
      setPendingFormData(formData);
      createCourseOnChain(priceUsd, metadataURI);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    
    if (errors[name as keyof CourseFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const isLoading = isPending || isConfirming || isCreatingInDb;

  return (
    <div className="py-8">
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StepIndicator step={1} currentStep={step} />
                <span className="text-sm font-medium">Course Info</span>
              </div>
              <div className="h-px flex-1 bg-border mx-4" />
              <div className="flex items-center gap-2">
                <StepIndicator step={2} currentStep={step} />
                <span className="text-sm font-medium">Preview & Create</span>
              </div>
            </div>
          </div>

          {step === 1 ? (
            <Step1Form
              formData={formData}
              errors={errors}
              categories={categories}
              onChange={handleChange}
              onImageChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
              onFreeChange={(isFree) => setFormData((prev) => ({ ...prev, isFree, price: isFree ? "" : prev.price }))}
              onNext={handleNext}
              isLoading={isLoading}
            />
          ) : (
            <Step2Preview
              formData={formData}
              categories={categories}
              onBack={handleBack}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          )}
        </div>
      </Container>
    </div>
  );
}

function StepIndicator({ step, currentStep }: { step: number; currentStep: number }) {
  const isActive = currentStep >= step;
  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}
    >
      {step}
    </div>
  );
}

type Step1Props = {
  formData: CourseFormData;
  errors: Partial<CourseFormData>;
  categories: { id: string; name: string; slug: string }[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onImageChange: (url: string) => void;
  onFreeChange: (isFree: boolean) => void;
  onNext: () => void;
  isLoading: boolean;
};

function Step1Form({ formData, errors, categories, onChange, onImageChange, onFreeChange, onNext, isLoading }: Step1Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Information</CardTitle>
        <p className="text-sm text-muted-foreground">
          Fill in the basic details about your course.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Course Title *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={onChange}
            placeholder="e.g., Solidity Fundamentals"
            className={`w-full rounded-lg border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary ${
              errors.title ? "border-destructive" : "border-border"
            }`}
          />
          {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={onChange}
            rows={4}
            placeholder="Describe what students will learn in this course..."
            className={`w-full rounded-lg border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary resize-none ${
              errors.description ? "border-destructive" : "border-border"
            }`}
          />
          {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={onChange}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isFree}
              onChange={(e) => onFreeChange(e.target.checked)}
              className="h-5 w-5 rounded border-border"
            />
            <div>
              <span className="text-sm font-medium">Free Course</span>
              <p className="text-xs text-muted-foreground">
                Make this course free for everyone
              </p>
            </div>
          </label>

          {!formData.isFree && (
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">
                Price (USD) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.price}
                  onChange={onChange}
                  placeholder="49.00"
                  className={`w-full rounded-lg border bg-background pl-8 pr-4 py-3 text-sm outline-none transition-colors focus:border-primary ${
                    errors.price ? "border-destructive" : "border-border"
                  }`}
                />
              </div>
              {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
              <p className="text-xs text-muted-foreground">
                You'll receive 92-95% of each sale (5% platform fee, 0-3% referrer fee)
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Cover Image</label>
          <ImageUpload
            value={formData.imageUrl}
            onChange={onImageChange}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Recommended: 16:9 aspect ratio, at least 1280x720px
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onNext} disabled={isLoading}>
            Continue
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type Step2Props = {
  formData: CourseFormData;
  categories: { id: string; name: string; slug: string }[];
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
};

function Step2Preview({ formData, categories, onBack, onSubmit, isLoading }: Step2Props) {
  const categoryName = categories.find(c => c.slug === formData.category)?.name || formData.category;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview & Create</CardTitle>
        <p className="text-sm text-muted-foreground">
          Review your course details before creating.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="aspect-video overflow-hidden rounded-lg border border-border">
          <img
            src={formData.imageUrl || "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop"}
            alt="Course preview"
            className="h-full w-full object-cover"
          />
        </div>

        <div>
          <h3 className="text-xl font-bold">{formData.title}</h3>
          <p className="mt-2 text-muted-foreground">{formData.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CategoryIcon className="h-4 w-4 text-muted-foreground" />
            <span>{categoryName}</span>
          </div>
          <div className="flex items-center gap-2">
            <PriceIcon className="h-4 w-4 text-muted-foreground" />
            <span>{formData.isFree ? "Free" : `$${formData.price}`}</span>
          </div>
        </div>

        {!formData.isFree && (
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium">Revenue breakdown</p>
            <div className="mt-2 space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Course price</span>
                <span>${formData.price}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform fee (5%)</span>
                <span>-${(Number(formData.price) * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Max referrer fee (3%)</span>
                <span>-${(Number(formData.price) * 0.03).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium text-foreground pt-2 border-t border-border">
                <span>You receive (min)</span>
                <span>${(Number(formData.price) * 0.92).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
          <p className="text-sm">
            <strong>Next step:</strong> After creating, you'll be able to add chapters, 
            lessons, videos, and markdown content. Your course will be saved as a draft 
            until you publish it.
          </p>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack} disabled={isLoading}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : formData.isFree ? "Create Free Course" : "Create & Pay On-Chain"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NotConnectedState() {
  return (
    <div className="py-8">
      <Container>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="mb-6 rounded-full bg-primary/10 p-6">
            <WalletIcon className="h-12 w-12 text-primary" />
          </div>
          <h1 className="mb-2 text-3xl font-bold">Connect Your Wallet</h1>
          <p className="mb-8 max-w-md text-muted-foreground">
            Connect your wallet to create and publish courses on Skola.
          </p>
          <ConnectButton />
        </div>
      </Container>
    </div>
  );
}

function NotStakedState() {
  const navigate = useNavigate();

  return (
    <div className="py-8">
      <Container>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="mb-6 rounded-full bg-primary/10 p-6">
            <LockIcon className="h-12 w-12 text-primary" />
          </div>
          <h1 className="mb-2 text-3xl font-bold">Become a Creator</h1>
          <p className="mb-8 max-w-md text-muted-foreground">
            Pay a one-time $20 fee to unlock unlimited course creation forever.
          </p>
          <Button onClick={() => navigate("/dashboard")}>Get Started</Button>
        </div>
      </Container>
    </div>
  );
}

function NotSignedInState({ onSignIn, isLoading }: { onSignIn: () => void; isLoading: boolean }) {
  return (
    <div className="py-8">
      <Container>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="mb-6 rounded-full bg-primary/10 p-6">
            <LockIcon className="h-12 w-12 text-primary" />
          </div>
          <h1 className="mb-2 text-3xl font-bold">Sign In Required</h1>
          <p className="mb-8 max-w-md text-muted-foreground">
            Sign in with your wallet to create courses.
          </p>
          <Button onClick={onSignIn} disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </div>
      </Container>
    </div>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
      />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function CategoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function PriceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
