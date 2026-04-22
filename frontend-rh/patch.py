import re

with open(r'c:\Users\yosrk\OneDrive\Bureau\Antigone Rh - Copie (3)\RH-Application\Frontend\src\pages\CalendrierProjetsAdminPage.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace MANAGERS array and constants
text = re.sub(r"const MANAGERS: ManagerDef\[\] = \[\s*\{[^\}]*\},\s*\{[^\}]*\},\s*\];", "", text)
text = text.replace("const manager    = MANAGERS.find(m => m.id === managerId)!;", "const manager = managers.find((m: any) => m.id === managerId) || {id:0, name:'', avatar:'', color:''};")
text = text.replace("MANAGERS.map(", "managers.map((")


# Replace state block
state_block = """  const [removeTarget, setRemoveTarget] = useState<string|null>(null);
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null);

  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    employeService.getByRole('MANAGER').then(res => {
      const data = res.data?.data || [];
      const mappers = data.map((m: any) => ({
        id: m.id,
        name: `${m.nom} ${m.prenom}`,
        avatar: `${m.nom?.[0] || ''}${m.prenom?.[0] || ''}`.toUpperCase(),
        color: 'bg-violet-500'
      }));
      setManagers(mappers);
      if (mappers.length > 0) setManagerId(mappers[0].id);
    });
  }, []);

  useEffect(() => {
    if (!managerId) return;
    const sDate = `${calYear}-${String(calMonth+1).padStart(2,'0')}-01`;
    const eD = new Date(calYear, calMonth+1, 0);
    const eDate = `${eD.getFullYear()}-${String(eD.getMonth()+1).padStart(2,'0')}-${String(eD.getDate()).padStart(2,'0')}`;
    
    setLoading(true);
    calendrierProjetService.getManagerSlotsBetween(managerId, sDate, eDate).then(res => {
      const busy = res.filter((r: any) => r.type === 'BUSY').map((r: any) => ({...r, date: r.dateSlot}));
      const booked = res.filter((r: any) => r.type === 'BOOKED').map((r: any) => ({...r, date: r.dateSlot}));
      setBusySlots(busy);
      setBookedSlots(booked);
      setLoading(false);
    });
  }, [managerId, calYear, calMonth]);"""

text = re.sub(
    r"  const \[removeTarget, setRemoveTarget\] = useState<string\|null>\(null\);\n  const \[toast, setToast\] = useState<\{msg:string;type:'success'\|'error'\}\|null>\(null\);",
    state_block, 
    text
)

# update confirmModal
confirm_block = """  const confirmModal = async () => {
    if (!inputName.trim() || !modalDate) { showToast('Veuillez saisir un nom.','error'); return; }
    
    try {
      if (modalMode === 'busy') {
        const slot = await calendrierProjetService.createBusySlot({
          managerId,
          dateSlot: modalDate,
          projectName: inputName.trim(),
          urgent: inputUrgent,
          type: 'BUSY',
          statut: 'VALIDE'
        });
        setBusySlots(p=>[...p,{...slot, date: slot.dateSlot}]);
        showToast(`Jour ${modalDate} marqué occupé : "${inputName}"`, 'success');
      } else {
        const slot = await calendrierProjetService.createBookedSlot({
          managerId,
          socialManagerId: (user as any)?.id,
          dateSlot: modalDate,
          projectName: inputName.trim(),
          urgent: inputUrgent,
          type: 'BOOKED',
          statut: 'EN_ATTENTE'
        });
        setBookedSlots(p=>[...p,{...slot, date: slot.dateSlot}]);
        showToast(
          inputUrgent
            ? `Urgent "${inputName}" planifié ! (notif)`
            : `"${inputName}" planifié avec succès !`,
          'success'
        );
      }
      setModalDate(null); setInputUrgent(false);
    } catch(e) {
      showToast('Erreur lors de la planification', 'error');
    }
  };"""

text = re.sub(r"  const confirmModal = \(\) => \{[\s\S]*?setModalDate\(null\); setInputUrgent\(false\);\n  \};", confirm_block, text)

# update confirmRemove
remove_block = """  const confirmRemove = async () => {
    if (!removeTarget) return;
    const targetSlot = busySlots.find(s=>s.date===removeTarget && s.managerId===managerId) as any;
    
    try {
        if(targetSlot && targetSlot.id) {
           await calendrierProjetService.deleteSlot(targetSlot.id);
        }
        setBusySlots(p=>p.filter(s=>!(s.date===removeTarget && s.managerId===managerId)));
        setRemoveTarget(null);
        showToast('Créneau supprimé, jour à nouveau disponible.','success');
    } catch(e) {
        showToast('Erreur lors de la suppression', 'error');
    }
  };"""

text = re.sub(r"  const confirmRemove = \(\) => \{[\s\S]*?showToast\('Créneau supprimé, jour à nouveau disponible\.','success'\);\n  \};", remove_block, text)

with open(r'c:\Users\yosrk\OneDrive\Bureau\Antigone Rh - Copie (3)\RH-Application\Frontend\src\pages\CalendrierProjetsAdminPage.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

