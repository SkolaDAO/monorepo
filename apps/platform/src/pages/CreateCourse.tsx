import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { parseUnits } from "viem";
import { Button, Card, CardContent, Container, toast } from "@skola/ui";
import { useCreatorInfo } from "../hooks/useCreatorRegistry";
import { useCreateCourse } from "../hooks/useCourseMarketplace";
import { useCreateCourse as useCreateCourseApi } from "../hooks/useApiCourses";
import { useCategories } from "../hooks/useCategories";
import { useAuth } from "../contexts/AuthContext";
import { ImageUpload } from "../components/ImageUpload";
import { CreatorModal } from "../components/CreatorModal";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { api } from "../lib/api";

type Step = 1 | 2 | 3 | 4;

type CourseFormData = {
  title: string;
  description: string;
  price: string;
  isFree: boolean;
  category: string;
  imageUrl: string;
};

type CreationEligibility = {
  isCreator: boolean;
  canCreateFree: boolean;
  canCreatePaid: boolean;
  trialCoursesUsed?: number;
  maxTrialCourses?: number;
  totalCourses: number;
};

export function CreateCoursePage() {
  const { isConnected } = useAccount();
  const { isAuthenticated, signIn, isLoading: authLoading } = useAuth();

  if (!isConnected) {
    return <NotConnectedState />;
  }

  if (!isAuthenticated) {
    return <NotSignedInState onSignIn={signIn} isLoading={authLoading} />;
  }

  return <CourseWizard />;
}

function CourseWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { isRegistered } = useCreatorInfo(address);

  const [step, setStep] = useState<Step>(1);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [eligibility, setEligibility] = useState<CreationEligibility | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    title: "",
    description: "",
    price: "",
    isFree: true,
    category: "",
    imageUrl: "",
  });
  const [errors, setErrors] = useState<Partial<CourseFormData>>({});

  const { categories } = useCategories();
  const {
    createCourse: createCourseOnChain,
    isPending,
    isConfirming,
    isSuccess,
    error,
    courseId: onChainCourseId,
  } = useCreateCourse();
  const { createCourse: createCourseInDb, isLoading: isCreatingInDb } = useCreateCourseApi();

  // Fetch eligibility on mount
  useEffect(() => {
    api
      .get<CreationEligibility>("/courses/creation-eligibility")
      .then(setEligibility)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData((prev) => ({ ...prev, category: categories[0].slug }));
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
          toast.error("Course created on-chain but failed to sync. Please contact support.", {
            id: "create-course",
          });
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

  const canCreatePaid = eligibility?.canCreatePaid ?? isRegistered;
  const canCreateFree = eligibility?.canCreateFree ?? true;
  const isTrialUser = !isRegistered && eligibility && !eligibility.isCreator;

  const validateStep = (currentStep: Step): boolean => {
    const newErrors: Partial<CourseFormData> = {};

    if (currentStep >= 2) {
      if (!formData.title.trim()) {
        newErrors.title = "Title is required";
      } else if (formData.title.length < 5) {
        newErrors.title = "Title must be at least 5 characters";
      }
    }

    if (currentStep >= 3) {
      if (!formData.description.trim()) {
        newErrors.description = "Description is required";
      } else if (formData.description.length < 20) {
        newErrors.description = "Description must be at least 20 characters";
      }
    }

    if (currentStep >= 4 && !formData.isFree) {
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
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 4) as Step);
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1) as Step);
  };

  const handleSubmit = async () => {
    if (formData.isFree) {
      toast.loading("Creating your course...", { id: "create-course" });
      try {
        const course = await createCourseInDb({
          title: formData.title,
          description: formData.description,
          thumbnail: formData.imageUrl || undefined,
          priceUsd: "0",
        });
        toast.success("Course created! Let's add some content.", { id: "create-course" });
        navigate(`/course/${course.id}/edit`);
      } catch (err: unknown) {
        const error = err as { code?: string };
        if (error?.code === "FREE_TRIAL_LIMIT_REACHED") {
          toast.error("Become a creator to create more courses!", { id: "create-course" });
          setShowCreatorModal(true);
        } else {
          toast.error("Failed to create course. Please try again.", { id: "create-course" });
        }
      }
    } else {
      if (!canCreatePaid) {
        setShowCreatorModal(true);
        return;
      }

      const USDC_DECIMALS = 6;
      const priceUsd = parseUnits(formData.price, USDC_DECIMALS);

      const metadata = JSON.stringify({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        imageUrl:
          formData.imageUrl ||
          "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop",
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

  const steps = [
    { number: 1, label: "Type" },
    { number: 2, label: "Title" },
    { number: 3, label: "Details" },
    { number: 4, label: "Launch" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Container>
        <div className="py-8 md:py-12">
          {/* Header */}
          <div className="mb-8 md:mb-12">
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Dashboard
            </button>

            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">Create Your Course</h1>
              <p className="text-muted-foreground text-lg">
                Share your knowledge with the world. Let's build something amazing.
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="max-w-2xl mx-auto mb-8 md:mb-12">
            <div className="flex items-center justify-between relative">
              {/* Progress line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-border">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                />
              </div>

              {steps.map((s) => (
                <div key={s.number} className="relative flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      step >= s.number
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > s.number ? <CheckIcon className="h-5 w-5" /> : s.number}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium transition-colors ${
                      step >= s.number ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Trial Banner for non-creators */}
          {isTrialUser && !canCreateFree && (
            <div className="max-w-2xl mx-auto mb-6">
              <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20">
                    <SparklesIcon className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">You've used your free trial course!</p>
                    <p className="text-xs text-muted-foreground">
                      Become a creator to unlock unlimited courses and paid content.
                    </p>
                  </div>
                  <Button size="sm" onClick={() => setShowCreatorModal(true)}>
                    Upgrade
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="max-w-2xl mx-auto">
            <Card className="border-0 shadow-2xl shadow-black/5 overflow-hidden">
              <CardContent className="p-0">
                {step === 1 && (
                  <Step1CourseType
                    formData={formData}
                    canCreatePaid={canCreatePaid}
                    canCreateFree={canCreateFree}
                    isTrialUser={isTrialUser || false}
                    onChange={(isFree) => setFormData((prev) => ({ ...prev, isFree }))}
                    onNext={handleNext}
                    onUpgrade={() => setShowCreatorModal(true)}
                  />
                )}

                {step === 2 && (
                  <Step2Title
                    formData={formData}
                    errors={errors}
                    onChange={handleChange}
                    onBack={handleBack}
                    onNext={handleNext}
                  />
                )}

                {step === 3 && (
                  <Step3Details
                    formData={formData}
                    errors={errors}
                    categories={categories}
                    onChange={handleChange}
                    onImageChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
                    onBack={handleBack}
                    onNext={handleNext}
                    isLoading={isLoading}
                  />
                )}

                {step === 4 && (
                  <Step4Launch
                    formData={formData}
                    categories={categories}
                    isLoading={isLoading}
                    onBack={handleBack}
                    onSubmit={handleSubmit}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>

      <CreatorModal
        isOpen={showCreatorModal}
        onClose={() => setShowCreatorModal(false)}
        onSuccess={() => {
          setShowCreatorModal(false);
          api.get<CreationEligibility>("/courses/creation-eligibility").then(setEligibility);
        }}
      />
    </div>
  );
}

/* ============================================
   STEP 1: Choose Course Type
   ============================================ */
type Step1Props = {
  formData: CourseFormData;
  canCreatePaid: boolean;
  canCreateFree: boolean;
  isTrialUser: boolean;
  onChange: (isFree: boolean) => void;
  onNext: () => void;
  onUpgrade: () => void;
};

function Step1CourseType({
  formData,
  canCreatePaid,
  canCreateFree,
  isTrialUser,
  onChange,
  onNext,
  onUpgrade,
}: Step1Props) {
  return (
    <div className="p-8 md:p-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <RocketIcon className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">What kind of course?</h2>
        <p className="text-muted-foreground">Choose how you want to share your knowledge</p>
      </div>

      <div className="grid gap-4 mb-8">
        {/* Free Course Option */}
        <button
          onClick={() => onChange(true)}
          disabled={!canCreateFree}
          className={`relative p-6 rounded-2xl text-left transition-all duration-200 group ${
            formData.isFree
              ? "bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary shadow-lg shadow-primary/10"
              : "bg-muted/50 border-2 border-transparent hover:border-primary/20 hover:bg-muted"
          } ${!canCreateFree ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl transition-colors ${
                formData.isFree ? "bg-primary text-primary-foreground" : "bg-background"
              }`}
            >
              <GiftIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">Free Course</h3>
                {isTrialUser && canCreateFree && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-600 rounded-full">
                    Trial
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Share knowledge freely. Great for building an audience and getting started.
              </p>
            </div>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                formData.isFree ? "border-primary bg-primary" : "border-muted-foreground/30"
              }`}
            >
              {formData.isFree && <CheckIcon className="h-4 w-4 text-primary-foreground" />}
            </div>
          </div>
        </button>

        {/* Paid Course Option */}
        <button
          onClick={() => (canCreatePaid ? onChange(false) : onUpgrade())}
          className={`relative p-6 rounded-2xl text-left transition-all duration-200 group ${
            !formData.isFree
              ? "bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary shadow-lg shadow-primary/10"
              : "bg-muted/50 border-2 border-transparent hover:border-primary/20 hover:bg-muted"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl transition-colors ${
                !formData.isFree ? "bg-primary text-primary-foreground" : "bg-background"
              }`}
            >
              <DollarIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">Paid Course</h3>
                {!canCreatePaid && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                    Creator Only
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Monetize your expertise. Keep 92-95% of every sale.
              </p>
            </div>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                !formData.isFree ? "border-primary bg-primary" : "border-muted-foreground/30"
              }`}
            >
              {!formData.isFree && <CheckIcon className="h-4 w-4 text-primary-foreground" />}
            </div>
          </div>

          {!canCreatePaid && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                One-time $20 creator fee unlocks unlimited paid courses forever.
              </p>
            </div>
          )}
        </button>
      </div>

      <Button
        className="w-full h-14 text-base"
        onClick={onNext}
        disabled={!canCreateFree && formData.isFree}
      >
        Continue
        <ArrowRightIcon className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}

/* ============================================
   STEP 2: Course Title
   ============================================ */
type Step2Props = {
  formData: CourseFormData;
  errors: Partial<CourseFormData>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onNext: () => void;
};

function Step2Title({ formData, errors, onChange, onBack, onNext }: Step2Props) {
  return (
    <div className="p-8 md:p-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <PencilIcon className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">What's your course called?</h2>
        <p className="text-muted-foreground">Choose a clear, descriptive title</p>
      </div>

      <div className="mb-8">
        <input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={onChange}
          placeholder="e.g., Mastering Solidity for DeFi"
          autoFocus
          className={`w-full rounded-2xl border-2 bg-muted/30 px-6 py-5 text-xl font-medium outline-none transition-all placeholder:text-muted-foreground/50 focus:bg-background ${
            errors.title ? "border-destructive" : "border-transparent focus:border-primary"
          }`}
        />
        {errors.title && <p className="mt-2 text-sm text-destructive">{errors.title}</p>}
        <p className="mt-3 text-sm text-muted-foreground">
          {formData.title.length}/200 characters
        </p>
      </div>

      <div className="rounded-2xl bg-muted/50 p-4 mb-8">
        <p className="text-sm font-medium mb-2">💡 Tips for a great title:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Be specific about what students will learn</li>
          <li>• Include keywords people search for</li>
          <li>• Keep it under 60 characters for best display</li>
        </ul>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" className="flex-1 h-14" onClick={onBack}>
          <ArrowLeftIcon className="mr-2 h-5 w-5" />
          Back
        </Button>
        <Button className="flex-1 h-14" onClick={onNext}>
          Continue
          <ArrowRightIcon className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

/* ============================================
   STEP 3: Details (Description, Category, Image)
   ============================================ */
type Step3Props = {
  formData: CourseFormData;
  errors: Partial<CourseFormData>;
  categories: { id: string; name: string; slug: string }[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onImageChange: (url: string) => void;
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;
};

function Step3Details({
  formData,
  errors,
  categories,
  onChange,
  onImageChange,
  onBack,
  onNext,
  isLoading,
}: Step3Props) {
  return (
    <div className="p-8 md:p-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <LayersIcon className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Tell us more</h2>
        <p className="text-muted-foreground">Help students understand what they'll learn</p>
      </div>

      <div className="space-y-6 mb-8">
        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={onChange}
            rows={4}
            placeholder="Describe what students will learn, what makes your course unique, and who it's for..."
            className={`w-full rounded-2xl border-2 bg-muted/30 px-5 py-4 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:bg-background resize-none ${
              errors.description ? "border-destructive" : "border-transparent focus:border-primary"
            }`}
          />
          {errors.description && (
            <p className="mt-2 text-sm text-destructive">{errors.description}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-2">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={onChange}
            className="w-full rounded-2xl border-2 border-transparent bg-muted/30 px-5 py-4 text-sm outline-none transition-all focus:bg-background focus:border-primary appearance-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium mb-2">Cover Image</label>
          <ImageUpload value={formData.imageUrl} onChange={onImageChange} disabled={isLoading} />
          <p className="mt-2 text-xs text-muted-foreground">
            Recommended: 16:9 aspect ratio, at least 1280x720px
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" className="flex-1 h-14" onClick={onBack}>
          <ArrowLeftIcon className="mr-2 h-5 w-5" />
          Back
        </Button>
        <Button className="flex-1 h-14" onClick={onNext}>
          Continue
          <ArrowRightIcon className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

/* ============================================
   STEP 4: Launch (Preview + Price + Create)
   ============================================ */
type Step4Props = {
  formData: CourseFormData;
  categories: { id: string; name: string; slug: string }[];
  isLoading: boolean;
  onBack: () => void;
  onSubmit: () => void;
};

function Step4Launch({ formData, categories, isLoading, onBack, onSubmit }: Step4Props) {
  const [priceInput, setPriceInput] = useState(formData.price);
  const categoryName =
    categories.find((c) => c.slug === formData.category)?.name || formData.category;

  return (
    <div>
      {/* Preview Card */}
      <div className="relative">
        <div className="aspect-video overflow-hidden">
          <img
            src={
              formData.imageUrl ||
              "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=450&fit=crop"
            }
            alt="Course preview"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium mb-3">
            <CategoryIcon className="h-3.5 w-3.5" />
            {categoryName}
          </span>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{formData.title}</h3>
          <p className="text-white/80 text-sm line-clamp-2">{formData.description}</p>
        </div>
      </div>

      {/* Pricing & Actions */}
      <div className="p-8 md:p-12">
        {!formData.isFree && (
          <div className="mb-8">
            <label className="block text-sm font-medium mb-3">Set Your Price</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={priceInput}
                onChange={(e) => {
                  setPriceInput(e.target.value);
                  formData.price = e.target.value;
                }}
                placeholder="49"
                className="w-full rounded-2xl border-2 border-transparent bg-muted/30 pl-12 pr-6 py-5 text-3xl font-bold outline-none transition-all focus:bg-background focus:border-primary"
              />
            </div>

            <div className="mt-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20">
                  <DollarIcon className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    You'll earn ${((Number(priceInput) || 0) * 0.92).toFixed(2)} per sale
                  </p>
                  <p className="text-xs text-muted-foreground">
                    5% platform fee, up to 3% referrer bonus
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {formData.isFree && (
          <div className="mb-8 rounded-2xl bg-primary/5 border border-primary/20 p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
              <GiftIcon className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-1">Free Course</h4>
            <p className="text-sm text-muted-foreground">
              Anyone can access this course. Great for building your audience!
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-muted/50 p-4 mb-8">
          <div className="flex items-start gap-3">
            <InfoIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">What happens next?</p>
              <p className="text-xs text-muted-foreground mt-1">
                After creating, you'll add chapters and lessons. Your course stays as a draft until
                you publish it.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" className="flex-1 h-14" onClick={onBack} disabled={isLoading}>
            <ArrowLeftIcon className="mr-2 h-5 w-5" />
            Back
          </Button>
          <Button className="flex-1 h-14 text-base" onClick={onSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner className="mr-2" />
                Creating...
              </>
            ) : (
              <>
                <RocketIcon className="mr-2 h-5 w-5" />
                Create Course
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   STATES: Not Connected / Not Signed In
   ============================================ */
function NotConnectedState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6">
          <WalletIcon className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Connect Your Wallet</h1>
        <p className="text-muted-foreground mb-8">
          Connect your wallet to create and publish courses on Skola.
        </p>
        <ConnectButton />
      </div>
    </div>
  );
}

function NotSignedInState({ onSignIn, isLoading }: { onSignIn: () => void; isLoading: boolean }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6">
          <LockIcon className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Sign In Required</h1>
        <p className="text-muted-foreground mb-8">
          Sign in with your wallet to create courses.
        </p>
        <Button size="lg" onClick={onSignIn} disabled={isLoading} className="h-14 px-8">
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </div>
    </div>
  );
}

/* ============================================
   ICONS
   ============================================ */
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  );
}

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
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

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
