'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CustomInput } from '@/components/ui/custom-input'
import { CustomSelect } from '@/components/ui/custom-select'
import { CustomCheckbox } from '@/components/ui/custom-checkbox'
import { registerUser, checkStudentNumber } from '@/app/actions/user'
import { getUniversities, getFaculties, getDepartments } from '@/app/actions/academic'
import { Upload, Camera } from 'lucide-react'

const CLASSES = [
    { label: "Hazırlık", value: "Hazırlık" },
    { label: "1. Sınıf", value: "1" },
    { label: "2. Sınıf", value: "2" },
    { label: "3. Sınıf", value: "3" },
    { label: "4. Sınıf", value: "4" },
    { label: "5. Sınıf", value: "5" },
    { label: "6. Sınıf", value: "6" }
]

export default function SignUpForm() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    // Password Visibility
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Form Data
    const [formData, setFormData] = useState({
        // Identity
        firstName: '',
        lastName: '',

        // Academic
        university: '',
        faculty: '',
        department: '',
        studentClass: '',
        studentNumber: '',

        // ID Card
        studentIdCardFile: null as File | null,
        studentIdCardUrl: '', // New field for uploaded URL

        // Account
        email: '',
        password: '',
        confirmPassword: '',
        marketingConsent: false,
        privacyConsent: false
    })

    // Dropdown Data
    const [universities, setUniversities] = useState<{ label: string, value: string }[]>([])
    const [faculties, setFaculties] = useState<{ label: string, value: string }[]>([])
    const [departments, setDepartments] = useState<{ label: string, value: string }[]>([])

    // Load Universites
    useEffect(() => {
        const loadUnis = async () => {
            const unis = await getUniversities();
            setUniversities(unis);
        }
        loadUnis();
    }, []);

    // Load Faculties (Dependent)
    useEffect(() => {
        if (formData.university) {
            const loadFacs = async () => {
                const facs = await getFaculties(formData.university);
                setFaculties(facs);
                // Reset dependents
                setFormData(prev => ({ ...prev, faculty: '', department: '' }));
            }
            loadFacs();
        }
    }, [formData.university]);

    // Load Departments (Dependent)
    useEffect(() => {
        if (formData.faculty) {
            const loadDepts = async () => {
                const depts = await getDepartments(formData.faculty);
                setDepartments(depts);
                setFormData(prev => ({ ...prev, department: '' }));
            }
            loadDepts();
        }
    }, [formData.faculty]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setError('')
    }

    const nextStep = async () => {
        setError('')

        // Step 1: Personal & Academic Info Validation
        if (step === 1) {
            const { firstName, lastName, university, department, studentClass, studentNumber } = formData;

            if (!firstName || !lastName) {
                setError('Lütfen Ad ve Soyad kısımlarını doldurunuz.');
                return;
            }

            if (!university || !department || !studentClass || !studentNumber) {
                // For manually typed unis (if any), faculty might be optional, but generally check all
                if (!formData.faculty && faculties.length > 0) {
                    setError('Lütfen fakülteyi seçiniz.');
                    return;
                }
                if (!department) {
                    setError('Lütfen bölümü seçiniz/giriniz.');
                    return;
                }
                setError('Lütfen tüm akademik bilgileri doldurunuz.');
                return;
            }

            if (formData.studentNumber.length !== 11) {
                setError('Öğrenci numarası 11 haneli olmalıdır.');
                return;
            }

            // Check Student Number Availability
            setIsLoading(true);
            const check = await checkStudentNumber(formData.studentNumber);
            setIsLoading(false);

            if (!check.available) {
                setError(check.message || "Bu öğrenci numarası ile kayıtlı bir kullanıcı zaten var.");
                return;
            }

            setStep(2);
        }
        // Step 2: File Upload Validation & Execution
        else if (step === 2) {
            if (!formData.studentIdCardFile) {
                setError('Lütfen öğrenci kimlik kartınızın fotoğrafını yükleyiniz.');
                return;
            }

            // Eğer dosya zaten yüklendiyse (URL varsa) direkt geç
            // Sadece dosya değiştiğinde URL'i sıfırlıyoruz (handleFileSelect'te)
            if (formData.studentIdCardUrl) {
                setStep(3);
                return;
            }

            // Upload Logic
            setIsLoading(true);
            try {
                const uploadRes = await fetch(`/api/upload-blob?filename=${formData.studentIdCardFile.name}`, {
                    method: 'POST',
                    body: formData.studentIdCardFile,
                });

                if (!uploadRes.ok) throw new Error('Kimlik yüklenirken hata oluştu. Lütfen tekrar deneyiniz.');
                const blob = await uploadRes.json();

                // Save URL
                setFormData(prev => ({ ...prev, studentIdCardUrl: blob.url }));
                setStep(3);
            } catch (err: any) {
                console.error(err);
                setError('Fotoğraf yüklenirken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
            } finally {
                setIsLoading(false);
            }
        }
        // Step 3 is final submit
    }

    const prevStep = () => {
        setError('')
        setStep(prev => prev - 1)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (step !== 3) {
            await nextStep();
            return;
        }

        // Account Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email || !emailRegex.test(formData.email)) {
            setError('Lütfen geçerli bir email adresi giriniz.');
            return;
        }

        if (!formData.password || formData.password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        if (!formData.privacyConsent) {
            setError('KVKK metnini onaylamanız zorunludur.')
            return
        }

        // Final Safety Check for URL
        if (!formData.studentIdCardUrl) {
            setError("Kimlik kartı yüklenmemiş. Lütfen geri dönüp tekrar yükleyiniz.");
            return;
        }

        setIsLoading(true)

        try {
            // 2. Register User (Upload is already done)
            const { confirmPassword, studentIdCardFile, studentIdCardUrl, ...submitData } = formData;

            const res = await registerUser({
                ...submitData,
                programLevel: "Lisans",
                studentIdCardUrl: studentIdCardUrl, // Use the uploaded URL
            })

            if (res.success) {
                setStep(4); // Success Step
            } else {
                setError(res.message || "Kayıt sırasında bir hata oluştu.")
            }
        } catch (err: any) {
            setError(err.message || 'Bir hata oluştu.')
        } finally {
            setIsLoading(false)
        }
    }

    const renderStep1 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-semibold text-foreground mb-2">Kişisel ve Akademik Bilgiler</h3>

            {/* Identity Grid */}
            <div className="grid grid-cols-2 gap-4">
                <CustomInput label="Ad" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} placeholder="Adınız" />
                <CustomInput label="Soyad" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} placeholder="Soyadınız" />
            </div>

            <hr className="border-border my-4" />

            {/* Academic Grid */}
            <CustomSelect label="Üniversite" options={universities} value={formData.university} onChange={(e) => handleChange('university', e.target.value)} placeholder="Üniversite Seçiniz" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomSelect label="Fakülte" options={faculties} value={formData.faculty} onChange={(e) => handleChange('faculty', e.target.value)} placeholder="Fakülte Seçiniz" disabled={!formData.university} />
                <CustomSelect label="Bölüm" options={departments} value={formData.department} onChange={(e) => handleChange('department', e.target.value)} placeholder="Bölüm Seçiniz" disabled={!formData.faculty} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <CustomSelect label="Sınıf" options={CLASSES} value={formData.studentClass} onChange={(e) => handleChange('studentClass', e.target.value)} placeholder="Sınıf" />
                <CustomInput label="Öğrenci Numarası" value={formData.studentNumber} onChange={(e) => handleChange('studentNumber', e.target.value)} placeholder="Öğrenci No" maxLength={11} />
            </div>

            <div className="flex justify-end mt-6">
                <button type="button" onClick={nextStep} disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-medium transition-colors w-full md:w-auto">
                    {isLoading ? 'Kontrol Ediliyor...' : 'Devam Et'}
                </button>
            </div>
        </div>
    )

    const [uploadError, setUploadError] = useState('')

    const handleFileSelect = (file: File) => {
        setUploadError('')
        // Basic client-side validation
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('Dosya boyutu 5MB\'dan küçük olmalıdır.')
            return
        }
        if (!file.type.startsWith('image/')) {
            setUploadError('Lütfen geçerli bir resim dosyası yükleyiniz.')
            return
        }
        // New file selected, reset URL to force re-upload
        setFormData(prev => ({ ...prev, studentIdCardFile: file, studentIdCardUrl: '' }))
    }

    const renderStep2 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">Öğrenci Kimlik Kartı</h3>
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-sm text-blue-600 dark:text-blue-400 text-left space-y-2">
                    <p className="font-semibold flex items-center gap-2">
                        <span className="text-lg">ℹ️</span> Fotoğraf Gereksinimleri:
                    </p>
                    <ul className="list-disc list-inside pl-1 space-y-1 opacity-90">
                        <li>Öğrenci kimlik kartınızın ön yüzü olmalıdır.</li>
                        <li>Yazılar ve fotoğraf net bir şekilde okunabilmelidir.</li>
                        <li>Kartın tamamı görünmelidir.</li>
                    </ul>
                </div>
            </div>

            {uploadError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg text-sm font-medium text-center animate-shake">
                    {uploadError}
                </div>
            )}

            <div className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center bg-muted/50 hover:bg-muted transition-colors group relative min-h-[200px]">

                {formData.studentIdCardFile ? (
                    <div className="text-center z-10 pointer-events-none">
                        <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-primary font-medium truncate max-w-[200px]">{formData.studentIdCardFile.name}</p>
                        <p className="text-xs text-muted-foreground mt-2">Değiştirmek için aşağıdan seçim yapın</p>
                    </div>
                ) : (
                    <div className="text-center group-hover:scale-105 transition-transform z-10 pointer-events-none">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-muted/80">
                            <Upload className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium">Fotoğraf Yüklemek İçin Seçin</p>
                        <p className="text-xs text-muted-foreground mt-2">PNG, JPG, JPEG (Max 5MB)</p>
                    </div>
                )}

                {/* Mobile Camera Button Overlay - Visible on small screens */}
                <div className="md:hidden w-full mt-4 flex gap-2 z-20">
                    <label className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform shadow-lg">
                        <Camera className="w-5 h-5" />
                        <span>Fotoğraf Çek</span>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                            className="hidden"
                        />
                    </label>
                    <label className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform shadow-sm">
                        <Upload className="w-5 h-5" />
                        <span>Dosya Seç</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                            className="hidden"
                        />
                    </label>
                </div>

                {/* Desktop File Input - Covers area */}
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                    className="hidden md:block absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
            </div>

            <div className="flex justify-between mt-8">
                <button type="button" onClick={prevStep} className="text-muted-foreground hover:text-foreground transition-colors">Geri</button>
                <button type="button" onClick={nextStep} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-medium transition-colors">Devam Et</button>
            </div>
        </div>
    )

    const renderStep3 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-semibold text-foreground mb-2">Hesap Oluştur</h3>

            {/* Disclaimer for Email */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg flex gap-3 text-sm text-yellow-600 dark:text-yellow-500 mb-6">
                <span className="text-xl">⚠️</span>
                <p>Doğrulama ve onay bildirimleri için lütfen <strong>aktif olarak kullandığınız ve erişebildiğiniz</strong> bir email adresi giriniz.</p>
            </div>

            <CustomInput label="Email Adresi" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="ornek@email.com" />

            <div className="relative">
                <CustomInput label="Şifre Belirle" type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => handleChange('password', e.target.value)} placeholder="En az 6 karakter" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground text-sm">{showPassword ? "Gizle" : "Göster"}</button>
            </div>

            <div className="relative">
                <CustomInput label="Şifre Tekrar" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} placeholder="Şifrenizi tekrar giriniz" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground text-sm">{showConfirmPassword ? "Gizle" : "Göster"}</button>
            </div>

            <div className="space-y-3 mt-4">
                <CustomCheckbox checked={formData.marketingConsent} onChange={(e) => handleChange('marketingConsent', e.target.checked)} label="Yeniliklerden haberdar olmak istiyorum." />
                <CustomCheckbox checked={formData.privacyConsent} onChange={(e) => handleChange('privacyConsent', e.target.checked)} label={<span className="text-sm"><Link href="/privacy" className="text-primary hover:underline">KVKK ve Aydınlatma Metni</Link>'ni okudum, onaylıyorum.</span>} />
            </div>

            <div className="flex justify-between mt-8">
                <button type="button" onClick={prevStep} className="text-muted-foreground hover:text-foreground transition-colors">Geri</button>
                <button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50">
                    {isLoading ? 'Kayıt Yapılıyor...' : 'Kaydı Tamamla'}
                </button>
            </div>
        </div>
    )

    const renderSuccess = () => (
        <div className="text-center py-10 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">✓</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Başvurunuz Alındı!</h2>
            <p className="text-muted-foreground px-6 max-w-lg mx-auto leading-relaxed">
                Kayıt başvurunuz başarıyla sistemimize ulaşmıştır.
                <br /><br />
                Yöneticilerimiz tarafından yapılan inceleme sonrasında, <strong>yaklaşık 12 saat içerisinde</strong> başvurunuz onaylanacak ve hesabınız aktif edilecektir.
                <br /><br />
                Onaylandığında email adresinize bilgilendirme gönderilecektir.
            </p>
            <Link href="/" className="mt-10 inline-block px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all">
                Ana Sayfaya Dön
            </Link>
        </div>
    )

    return (
        <div className="bg-card p-8 rounded-2xl shadow-xl border border-border">
            {step < 4 && (
                <div className="w-full bg-muted h-2 rounded-full mb-8 overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-300 ease-out" style={{ width: `${(step / 3) * 100}%` }} />
                </div>
            )}

            {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg mb-6 text-sm flex items-center gap-2"><span className="text-lg">⚠️</span>{error}</div>}

            <form onSubmit={handleSubmit}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderSuccess()}
            </form>
        </div>
    )
}
