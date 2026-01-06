'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CustomInput } from '@/components/ui/custom-input'
import { CustomSelect } from '@/components/ui/custom-select'
import { CustomCheckbox } from '@/components/ui/custom-checkbox'
import { validateIdentityAction, registerUser, checkStudentNumber } from '@/app/actions/user'
import { getUniversities, getFaculties, getDepartments } from '@/app/actions/academic'

const PROGRAM_LEVELS = [
    { label: "Ön Lisans", value: "Ön Lisans" },
    { label: "Lisans", value: "Lisans" },
    { label: "Yüksek Lisans", value: "Yüksek Lisans" },
    { label: "Doktora", value: "Doktora" }
]

const CLASSES_STANDARD = [
    { label: "Hazırlık", value: "Hazırlık" },
    { label: "1. Sınıf", value: "1" },
    { label: "2. Sınıf", value: "2" },
    { label: "3. Sınıf", value: "3" },
    { label: "4. Sınıf", value: "4" }
]

const CLASSES_EXTENDED = [
    ...CLASSES_STANDARD,
    { label: "5. Sınıf", value: "5" },
    { label: "6. Sınıf", value: "6" }
]

export default function SignUpForm() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    // State for Password Visibility
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Form Data
    const [formData, setFormData] = useState({
        // Step 1: Degree
        programLevel: '',

        // Step 2: Identity
        firstName: '',
        lastName: '',
        birthYear: '',
        tcIdentityNo: '',

        // Step 3: Academic
        university: '',
        faculty: '',
        department: '',
        studentClass: '',
        studentNumber: '',

        // Step 4: Account
        email: '',
        password: '',
        confirmPassword: '',
        marketingConsent: false,
        privacyConsent: false
    })

    // Dropdown Data Options
    const [universities, setUniversities] = useState<{ label: string, value: string, disabled?: boolean }[]>([])
    const [faculties, setFaculties] = useState<{ label: string, value: string }[]>([])
    const [departments, setDepartments] = useState<{ label: string, value: string }[]>([])
    const [classOptions, setClassOptions] = useState(CLASSES_STANDARD)

    // Identity Validation State
    const [isIdentityVerified, setIsIdentityVerified] = useState(false)

    // Load initial data
    useEffect(() => {
        const loadUnis = async () => {
            const unis = await getUniversities();
            setUniversities(unis);
        }
        loadUnis();
    }, []);

    // Effect: Fetch Faculties when Uni changes
    useEffect(() => {
        if (formData.programLevel === 'Lisans' && formData.university) {
            const loadFacs = async () => {
                const facs = await getFaculties(formData.university);
                setFaculties(facs);
                // Reset dependent fields
                setFormData(prev => ({ ...prev, faculty: '', department: '' }));
            }
            loadFacs();
        }
    }, [formData.university, formData.programLevel]);

    // Effect: Fetch Departments when Faculty changes
    useEffect(() => {
        if (formData.programLevel === 'Lisans' && formData.faculty) {
            const loadDepts = async () => {
                const depts = await getDepartments(formData.faculty);
                setDepartments(depts);
                setFormData(prev => ({ ...prev, department: '' }));
            }
            loadDepts();
        }
    }, [formData.faculty, formData.programLevel]);

    // Effect: Adjust Class Options based on Department (Mock Logic for 'Tıp')
    useEffect(() => {
        // Since department is just a string name now
        const deptName = formData.department.toLowerCase();
        if (deptName.includes('tıp') || deptName.includes('diş')) {
            setClassOptions(CLASSES_EXTENDED);
        } else {
            setClassOptions(CLASSES_STANDARD);
        }
    }, [formData.department]);


    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setError('') // Clear error on change
    }

    const nextStep = async () => {
        setError('')

        // Validation per step
        if (step === 1) {
            if (!formData.programLevel) {
                setError('Lütfen bir eğitim seviyesi seçiniz.');
                return;
            }
            setStep(2);
        }
        else if (step === 2) {
            if (!formData.firstName || !formData.lastName || !formData.birthYear || !formData.tcIdentityNo) {
                setError('Lütfen tüm kimlik bilgilerini doldurunuz.');
                return;
            }
            setIsLoading(true);
            const validation = await validateIdentityAction({
                tcIdentityNo: formData.tcIdentityNo,
                firstName: formData.firstName,
                lastName: formData.lastName,
                birthYear: Number(formData.birthYear)
            });
            setIsLoading(false);

            if (!validation.success) {
                setError(validation.message || 'Kimlik doğrulama başarısız.');
                return;
            }
            setIsIdentityVerified(true);
            setStep(3);
        }
        else if (step === 3) {
            if (!formData.university || !formData.department || !formData.studentClass || !formData.studentNumber) {
                // Note: Faculty might be optional if 'Other' uni logic existed, but for Konya list it's required
                if (formData.programLevel === 'Lisans' && !formData.faculty) {
                    setError('Lütfen fakülteyi seçiniz.');
                    return;
                }
                setError('Lütfen tüm akademik bilgileri eksiksiz doldurunuz.');
                return;
            }
            if (formData.studentNumber.length !== 11) {
                setError('Öğrenci numarası 11 haneli olmalıdır.');
                return;
            }

            // Check Uniqueness
            setIsLoading(true);
            const check = await checkStudentNumber(formData.studentNumber);
            setIsLoading(false);

            if (!check.available) {
                setError(check.message || "Bu numara kullanılamaz.");
                return;
            }

            setStep(4);
        }
    }

    const prevStep = () => {
        setError('')
        setStep(prev => prev - 1)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Prevent premature submission on Enter key (if not on last step)
        if (step !== 4) {
            await nextStep();
            return;
        }

        // 1. Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email || !emailRegex.test(formData.email)) {
            setError('Lütfen geçerli bir email adresi giriniz. (@ içermelidir)');
            return;
        }

        // 2. Password Validation
        if (!formData.password || formData.password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            return;
        }

        // 3. Confirm Password Match
        if (formData.password !== formData.confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        // 4. KVKK Consent
        if (!formData.privacyConsent) {
            setError('KVKK metnini onaylamanız zorunludur.')
            return
        }

        setIsLoading(true)
        // Exclude confirmPassword from payload
        const { confirmPassword, ...submitData } = formData;

        const res = await registerUser({
            ...submitData,
            birthYear: Number(formData.birthYear)
        })
        setIsLoading(false)

        if (res.success) {
            router.push('/auth/signin?registered=true')
        } else {
            setError(res.message || "Kayıt sırasında bir hata oluştu.")
        }
    }

    // Step 1: Degree Level
    const renderStep1 = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Eğitim Seviyenizi Seçin</h3>
            <div className="grid grid-cols-1 gap-3">
                {PROGRAM_LEVELS.map((level) => (
                    <button
                        key={level.value}
                        type="button"
                        onClick={() => handleChange('programLevel', level.value)}
                        className={`p-4 rounded-lg border text-left transition-all ${formData.programLevel === level.value
                            ? 'border-[#00b4d8] bg-[#00b4d8]/10 text-[#00b4d8]'
                            : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'
                            }`}
                    >
                        {level.label}
                    </button>
                ))}
            </div>
            <button
                type="button"
                onClick={nextStep}
                disabled={!formData.programLevel}
                className="w-full mt-6 bg-[#00b4d8] hover:bg-[#0096c7] text-white p-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Devam Et
            </button>
        </div>
    )

    // Step 2: Identity
    const renderStep2 = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Kimlik Bilgileri</h3>
            <div className="grid grid-cols-2 gap-4">
                <CustomInput
                    label="Ad"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder="ADINIZ"
                />
                <CustomInput
                    label="Soyad"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="SOYADINIZ"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <CustomInput
                    label="Doğum Yılı"
                    type="number"
                    value={formData.birthYear}
                    onChange={(e) => handleChange('birthYear', e.target.value)}
                    placeholder="YYYY"
                />
                <CustomInput
                    label="TC Kimlik No"
                    type="text"
                    value={formData.tcIdentityNo}
                    onChange={(e) => handleChange('tcIdentityNo', e.target.value)}
                    placeholder="11 Haneli TC Kimlik No"
                    maxLength={11}
                />
            </div>
            <div className="flex justify-between mt-6">
                <button
                    type="button"
                    onClick={prevStep}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    Geri
                </button>
                <button
                    type="button"
                    onClick={nextStep}
                    disabled={isLoading}
                    className="bg-[#00b4d8] hover:bg-[#0096c7] text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Kontrol Ediliyor...' : 'Devam Et'}
                </button>
            </div>
        </div>
    )

    // Step 3: Academic
    const renderStep3 = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Akademik Bilgiler</h3>

            {/* Conditional Rendering based on Lisans */}
            {formData.programLevel === 'Lisans' ? (
                <>
                    <CustomSelect
                        label="Üniversite"
                        options={universities}
                        value={formData.university}
                        onChange={(e) => handleChange('university', e.target.value)}
                        placeholder="Üniversite Seçiniz"
                    />
                    <CustomSelect
                        label="Fakülte"
                        options={faculties}
                        value={formData.faculty}
                        onChange={(e) => handleChange('faculty', e.target.value)}
                        placeholder="Fakülte Seçiniz"
                        disabled={!formData.university}
                    />
                    <CustomSelect
                        label="Bölüm"
                        options={departments}
                        value={formData.department}
                        onChange={(e) => handleChange('department', e.target.value)}
                        placeholder="Bölüm Seçiniz"
                        disabled={!formData.faculty}
                    />
                </>
            ) : (
                /* Free Text Inputs for Non-Lisans */
                <>
                    <CustomInput
                        label="Üniversite"
                        type="text"
                        value={formData.university}
                        onChange={(e) => handleChange('university', e.target.value)}
                        placeholder="Üniversite Adı"
                    />
                    <CustomInput
                        label="Fakülte / Enstitü"
                        type="text"
                        value={formData.faculty}
                        onChange={(e) => handleChange('faculty', e.target.value)}
                        placeholder="Fakülte veya Enstitü Adı"
                    />
                    <CustomInput
                        label="Bölüm / Program"
                        type="text"
                        value={formData.department}
                        onChange={(e) => handleChange('department', e.target.value)}
                        placeholder="Bölüm Adı"
                    />
                </>
            )}

            <div className="grid grid-cols-2 gap-4">
                <CustomSelect
                    label="Sınıf"
                    options={classOptions}
                    value={formData.studentClass}
                    onChange={(e) => handleChange('studentClass', e.target.value)}
                    placeholder="Sınıf Seçiniz"
                />
                <CustomInput
                    label="Öğrenci Numarası"
                    type="text"
                    value={formData.studentNumber}
                    onChange={(e) => handleChange('studentNumber', e.target.value)}
                    placeholder="11 Rakamlı No"
                    maxLength={11}
                />
            </div>

            <div className="flex justify-between mt-6">
                <button
                    type="button"
                    onClick={prevStep}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    Geri
                </button>
                <button
                    type="button"
                    onClick={nextStep}
                    className="bg-[#00b4d8] hover:bg-[#0096c7] text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                    Devam Et
                </button>
            </div>
        </div>
    )

    // Step 4: Account
    const renderStep4 = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Hesap Oluştur</h3>
            <CustomInput
                label="Email Adresi"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="ornek@ogrenci.edu.tr"
            />

            <div className="relative">
                <CustomInput
                    label="Şifre Belirle"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="En az 6 karakter"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-gray-400 hover:text-white"
                >
                    {showPassword ? "Gizle" : "Göster"}
                </button>
            </div>

            <div className="relative">
                <CustomInput
                    label="Şifre Tekrar"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="Şifrenizi tekrar giriniz"
                />
                <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-[34px] text-gray-400 hover:text-white"
                >
                    {showConfirmPassword ? "Gizle" : "Göster"}
                </button>
            </div>

            <div className="space-y-3 mt-4">
                <CustomCheckbox
                    checked={formData.marketingConsent}
                    onChange={(e) => handleChange('marketingConsent', e.target.checked)}
                    label="Yeniliklerden ve güncellemelerden haberdar olmak istiyorum."
                />
                <CustomCheckbox
                    checked={formData.privacyConsent}
                    onChange={(e) => handleChange('privacyConsent', e.target.checked)}
                    label={
                        <span className="text-sm">
                            <Link href="/privacy" className="text-[#00b4d8] hover:underline">KVKK ve Aydınlatma Metni</Link>'ni okudum, onaylıyorum.
                        </span>
                    }
                />
            </div>

            <div className="flex justify-between mt-6">
                <button
                    type="button"
                    onClick={prevStep}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    Geri
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#00b4d8] hover:bg-[#0096c7] text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Hesap Oluşturuluyor...' : 'Kaydı Tamamla'}
                </button>
            </div>
        </div>
    )

    return (
        <div className="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800">
            {/* Progress Bar */}
            <div className="w-full bg-gray-800 h-2 rounded-full mb-8 overflow-hidden">
                <div
                    className="bg-[#00b4d8] h-full transition-all duration-300 ease-out"
                    style={{ width: `${(step / 4) * 100}%` }}
                />
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg mb-6 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
            </form>
        </div>
    )
}
