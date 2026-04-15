import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import contactImg from "@assets/pexels-innocent-kapesa-760824113-18751317_1776285262172.jpg";

const formSchema = z.object({
  name: z.string().min(2, { message: "Nom requis" }),
  email: z.string().email({ message: "Email invalide" }),
  phone: z.string().optional(),
  date: z.string().optional(),
  type: z.string().min(1, { message: "Type de service requis" }),
  message: z.string().min(10, { message: "Message requis (min 10 caractères)" })
});

type FormValues = z.infer<typeof formSchema>;

export default function Contact() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      date: "",
      type: "",
      message: ""
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("contact.form.success"),
      });
      form.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t("contact.form.error"),
      });
    }
  });

  function onSubmit(values: FormValues) {
    mutation.mutate(values);
  }

  return (
    <div className="w-full pt-28">
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold font-serif mb-6 text-foreground"
          >
            {t("contact.title")}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            {t("contact.subtitle")}
          </motion.p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 md:px-12 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card p-10 border border-border shadow-sm"
            >
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("contact.form.name")}</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} className="bg-white border-border rounded-none focus-visible:ring-primary" data-testid="input-contact-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("contact.form.email")}</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} className="bg-white border-border rounded-none focus-visible:ring-primary" data-testid="input-contact-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("contact.form.phone")}</FormLabel>
                          <FormControl>
                            <Input placeholder="+32 4XX XX XX XX" {...field} className="bg-white border-border rounded-none focus-visible:ring-primary" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("contact.form.date")}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-white border-border rounded-none focus-visible:ring-primary" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("contact.form.type")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white border-border rounded-none focus-visible:ring-primary">
                              <SelectValue placeholder="Sélectionnez un service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="complete">{t("contact.form.type_options.complete")}</SelectItem>
                            <SelectItem value="partial">{t("contact.form.type_options.partial")}</SelectItem>
                            <SelectItem value="day_of">{t("contact.form.type_options.day_of")}</SelectItem>
                            <SelectItem value="other">{t("contact.form.type_options.other")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("contact.form.message")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="..." 
                            className="min-h-[150px] bg-white border-border rounded-none focus-visible:ring-primary resize-none" 
                            {...field} 
                            data-testid="textarea-contact-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-14"
                    disabled={mutation.isPending}
                    data-testid="button-contact-submit"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t("contact.form.submitting")}
                      </>
                    ) : (
                      t("contact.form.submit")
                    )}
                  </Button>

                  {mutation.isSuccess && (
                    <div className="p-4 bg-green-50 text-green-800 border border-green-200 mt-4 text-center font-medium">
                      {t("contact.form.success")}
                    </div>
                  )}
                </form>
              </Form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col justify-between"
            >
              <div className="mb-10">
                <img 
                  src={contactImg} 
                  alt="Wedding Rings" 
                  className="w-full h-[400px] object-cover rounded-sm shadow-md"
                />
              </div>
              <div className="bg-background p-10 border border-border">
                <h3 className="text-2xl font-serif font-bold mb-6 text-foreground">Informations Pratiques</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p className="flex items-center">
                    <span className="w-10 font-bold text-primary">Email</span>
                    <a href={`mailto:${t("footer.email")}`} className="hover:text-primary">{t("footer.email")}</a>
                  </p>
                  <p className="flex items-center">
                    <span className="w-10 font-bold text-primary">Tél</span>
                    <a href={`tel:${t("footer.phone")}`} className="hover:text-primary">{t("footer.phone")}</a>
                  </p>
                  <p className="flex items-center">
                    <span className="w-10 font-bold text-primary">Lieu</span>
                    <span>{t("footer.address")} (Sur rendez-vous uniquement)</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}