
import { useState } from 'react';
import { Control, useFieldArray } from 'react-hook-form';
import { Calendar, GraduationCap, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import type { ProfileFormValues } from '../profileSchema';

interface WizardCertificationsProps {
  control: Control<ProfileFormValues>;
}

export const WizardCertifications = ({ control }: WizardCertificationsProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "certifications",
  });
  
  const [dateOpen, setDateOpen] = useState<Record<string, boolean>>({});

  const toggleDatePopover = (index: number, dateType: string) => {
    const key = `${index}-${dateType}`;
    setDateOpen((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <h2 className="text-xl font-semibold">Coaching Certifications</h2>
        <p className="text-muted-foreground">
          Add your tennis coaching certifications to showcase your qualifications.
        </p>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-md p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Certification {index + 1}</h4>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => remove(index)}
                    className="text-destructive h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove certification</span>
                  </Button>
                </div>

                <FormField
                  control={control}
                  name={`certifications.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title*</FormLabel>
                      <FormControl>
                        <Input placeholder="Certification Title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`certifications.${index}.issuing_organization`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issuing Organization*</FormLabel>
                      <FormControl>
                        <Input placeholder="Organization Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name={`certifications.${index}.issue_date`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Date</FormLabel>
                        <Popover 
                          open={dateOpen[`${index}-issue`]} 
                          onOpenChange={() => toggleDatePopover(index, 'issue')}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal ${
                                  !field.value ? "text-muted-foreground" : ""
                                }`}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {field.value ? format(new Date(field.value), "PPP") : "Issue Date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                field.onChange(date ? date.toISOString() : '');
                                toggleDatePopover(index, 'issue');
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`certifications.${index}.expiry_date`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <Popover 
                          open={dateOpen[`${index}-expiry`]} 
                          onOpenChange={() => toggleDatePopover(index, 'expiry')}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal ${
                                  !field.value ? "text-muted-foreground" : ""
                                }`}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {field.value ? format(new Date(field.value), "PPP") : "Expiry Date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                field.onChange(date ? date.toISOString() : '');
                                toggleDatePopover(index, 'expiry');
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => append({
              title: '',
              issuing_organization: '',
              issue_date: '',
              expiry_date: ''
            })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Certification
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WizardCertifications;
