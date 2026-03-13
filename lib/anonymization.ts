export type AnonymizationRole = "USER" | "ADMIN" | "PARTNER" | string;

export interface AnonymizationSubject {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    department?: string | null;
    role?: AnonymizationRole | null;
}

export interface AnonymizationViewer {
    id?: string;
    role?: AnonymizationRole | null;
}

export interface AnonymizationOptions {
    /**
     * Whether the subject should see their own real name when viewer === subject.
     * Defaults to true.
     */
    selfShowRealName?: boolean;
    /**
     * Whether admins should see real names instead of pseudonyms
     * when viewer.role === 'ADMIN'. Defaults to false so that
     * admin UI'leri bilinçli olarak gerçek isimleri isteyerek kullanır.
     */
    adminSeeRealName?: boolean;
}

const DEFAULT_OPTIONS: Required<AnonymizationOptions> = {
    selfShowRealName: true,
    adminSeeRealName: false,
};

/**
 * Bölüm bilgisinden anonim takma isim üretir.
 * Örn: "Elektrik-Elektronik Mühendisliği" -> "Elektrik-Elektronik Mühendisliği İneği"
 */
export function getAnonymousNameByDepartment(department?: string | null): string {
    const trimmed = (department || "").trim();
    if (!trimmed) {
        return "Anonim İnek";
    }
    return `${trimmed} İneği`;
}

function getRealFullName(user: AnonymizationSubject): string | null {
    const full = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return full || null;
}

/**
 * Viewer (bakan kullanıcı) ve subject (görüntülenen kullanıcı)
 * bağlamına göre gösterilecek ismi üretir.
 *
 * Varsayılan kurallar:
 * - Kullanıcı kendine bakıyorsa ve selfShowRealName === true ise: gerçek adı göster.
 * - Admin ise ve adminSeeRealName === true ise: "Gerçek Ad (Bölüm İneği)" formatı dönebilir.
 * - Diğer tüm durumlarda: bölüm-temelli anonim isim.
 */
export function getAnonymousNameForUser(
    subject: AnonymizationSubject,
    viewer?: AnonymizationViewer | null,
    options?: AnonymizationOptions,
): string {
    const { selfShowRealName, adminSeeRealName } = { ...DEFAULT_OPTIONS, ...(options || {}) };

    const anonymousByDept = getAnonymousNameByDepartment(subject.department);
    const realName = getRealFullName(subject);

    if (viewer && subject.id && viewer.id && subject.id === viewer.id) {
        // Self-view: kullanıcı kendi adını görebilir.
        if (selfShowRealName && realName) {
            return realName;
        }
        return anonymousByDept;
    }

    if (viewer?.role === "ADMIN" && adminSeeRealName && realName) {
        return `${realName} (${anonymousByDept})`;
    }

    return anonymousByDept;
}

