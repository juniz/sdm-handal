Berikut adalah **raw code** lengkapnya. Anda bisa langsung klik tombol "Copy" di pojok kanan atas blok kode ini dan paste ke dalam file `SKILL.md` Anda.

```markdown
---
name: shadcn-react-patterns
description: Modern React UI patterns using Shadcn UI for loading states, error handling, and data fetching. Best practices for skeleton loading, form validation, and feedback loops.
---

# Shadcn UI React Patterns

## Core Principles

1.  **Never show stale UI** - Use `<Skeleton />` or loading buttons appropriately.
2.  **Always surface errors** - Use `Toast` for transient errors, `Alert` for persistent ones.
3.  **Optimistic updates** - UI reacts instantly, validates in background.
4.  **Visual Consistency** - Use Shadcn design tokens (muted-foreground, destructive) instead of raw colors.

## Loading State Patterns

### The Golden Rule

**Show loading indicator ONLY when there's no data to display.**

```tsx
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

// CORRECT - Only show Skeleton when no data exists
const { data, isLoading, error } = useGetItemsQuery();

if (error) {
  return (
    <Alert variant="destructive">
      <AlertDescription>Failed to load data.</AlertDescription>
    </Alert>
  )
}

// Show skeleton only on initial load (loading AND no data)
if (isLoading && !data) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
    </div>
  )
}

if (!data?.items.length) return <EmptyState />;

return <ItemList items={data.items} />;

```

### Loading State Decision Tree

```
Is there an error?
  → Yes: Show <Alert variant="destructive" />
  → No: Continue

Is it loading AND we have no data?
  → Yes: Show <Skeleton /> structure matching content shape
  → No: Continue

Do we have data?
  → Yes, with items: Show the data (DataTable or Cards)
  → Yes, but empty: Show EmptyState (Card or centered layout)
  → No: Show loading fallback

```

### Skeleton vs Loader2 (Spinner)

| Use `<Skeleton />` When | Use `<Loader2 />` When |
| --- | --- |
| Loading initial page content | Button actions (`isSubmitting`) |
| Card/Table layouts | Modal/Dialog saving states |
| Preventing layout shift (CLS) | Inline minor updates |

## Error Handling Patterns

### The Error Handling Hierarchy

```
1. Inline error → <FormMessage /> (Shadcn Form context)
2. Toast notification → toast.error() (Sonner/Toaster)
3. Error banner → <Alert variant="destructive" />
4. Full error screen → Layout with typography h1/p

```

### Toast Integration (Sonner/Toaster)

**CRITICAL: Never swallow errors silently.**

```tsx
import { toast } from "sonner" // or "@/components/ui/use-toast"

// CORRECT - Error always surfaced via Toast
const [createItem, { isLoading }] = useCreateItemMutation({
  onSuccess: () => {
    toast.success("Item created", {
      description: "Your new item has been added to the list.",
    });
  },
  onError: (error) => {
    console.error(error);
    toast.error("Uh oh! Something went wrong.", {
      description: error.message || "There was a problem with your request.",
      action: {
        label: "Undo",
        onClick: () => console.log("Undo"),
      },
    });
  },
});

```

### Error State Component (Using Alert)

```tsx
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  error: Error;
  onRetry?: () => void;
}

const ErrorState = ({ error, onRetry }: ErrorStateProps) => (
  <Alert variant="destructive" className="my-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription className="flex flex-col gap-2">
      <p>{error.message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="w-fit bg-background text-destructive hover:bg-destructive/10">
          Try Again
        </Button>
      )}
    </AlertDescription>
  </Alert>
);

```

## Button State Patterns

### Button Loading State

Use the `Loader2` icon from lucide-react with `animate-spin`.

```tsx
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// CORRECT - Button disabled and showing spinner
<Button disabled={isSubmitting} type="submit">
  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isSubmitting ? "Submitting..." : "Submit"}
</Button>

```

## Empty States

Shadcn doesn't have a core "Empty" component, so we compose one using Typography and Icons.

### Composable Empty State

```tsx
import { FileQuestion } from "lucide-react"

const EmptyState = ({ title, description, action }: any) => (
  <div className="flex flex-col items-center justify-center space-y-3 py-12 text-center border rounded-lg border-dashed bg-muted/10">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
      <FileQuestion className="h-6 w-6 text-muted-foreground" />
    </div>
    <div className="space-y-1">
      <h3 className="text-lg font-medium tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    {action && <div className="pt-2">{action}</div>}
  </div>
);

// Usage
<EmptyState 
  title="No items found" 
  description="You haven't created any items yet."
  action={<Button>Create Item</Button>} 
/>

```

## Form Patterns (React Hook Form + Zod)

The standard Shadcn pattern uses `zod` for validation and `Form` components for layout.

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  username: z.string().min(2, { message: "Username must be at least 2 characters." }),
})

export function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "" },
  })

  // Loading state comes from the mutation hook or form state
  const isSubmitting = form.formState.isSubmitting;

  function onSubmit(values: z.infer<typeof formSchema>) {
    // API Call here
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                {/* Error styling is handled automatically by shadcn Input */}
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              {/* Inline Error Message */}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit
        </Button>
      </form>
    </Form>
  )
}

```

## Anti-Patterns

### Loading States

```tsx
// WRONG - Blocking the UI with a full-screen spinner for minor updates
if (isFetching) return <FullPageSpinner />;

// CORRECT - Show opacity or a small spinner next to the title
<div className={cn("transition-opacity", isFetching && "opacity-50 pointer-events-none")}>
  <DataTable data={data} />
</div>

```

### Feedback

```tsx
// WRONG - Using native browser alert
alert("Error saving data");

// CORRECT - Using Shadcn Toast
toast.error("Error saving data");

```

## Checklist

Before completing any Shadcn UI component:

**UI States:**

* [ ] Error state uses `<Alert variant="destructive">` or `toast.error`
* [ ] Loading state uses `<Skeleton />` matching the content shape
* [ ] Empty state uses styled container with `text-muted-foreground`
* [ ] Buttons have `disabled={isLoading}` and `<Loader2 />`

**Forms:**

* [ ] Uses `<Form>` wrapper with `zod` schema
* [ ] Field errors map to `<FormMessage />`
* [ ] Submit button shows loading state

```

```