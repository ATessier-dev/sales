"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Tag } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, categoriesTranslations, type Language } from "@/translations";
import { CategoryForm, type CategoryEntry } from "./editCategory";

export function CategoriesManager({ language, categories }: { language: Language; categories: CategoryEntry[] }) {
  const router = useRouter();
  const [formMode, setFormMode] = useState<"create" | CategoryEntry | null>(null);

  function handleSaved() {
    setFormMode(null);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <PageHeading
        title={
          <span className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" aria-hidden="true" />
            {getTranslation(categoriesTranslations.title, language)}
          </span>
        }
        actions={
          <Button size="sm" onClick={() => setFormMode("create")}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {getTranslation(categoriesTranslations.addCategory, language)}
          </Button>
        }
      />

      {formMode && (
        <CategoryForm
          language={language}
          initialValues={formMode === "create" ? undefined : formMode}
          onCancel={() => setFormMode(null)}
          onSaved={handleSaved}
          onDeleted={handleSaved}
        />
      )}

      <div className="flex w-full flex-col gap-3">
        {categories.length === 0 ? (
          <p className="text-xs text-muted-foreground">{getTranslation(categoriesTranslations.empty, language)}</p>
        ) : (
          categories.map((category) => (
            <Card key={category.id} className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  {category.name}
                  {!category.active && <span className="text-xs font-normal text-muted-foreground">inactif</span>}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setFormMode(category)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  {getTranslation(categoriesTranslations.editCategory, language)}
                </Button>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
